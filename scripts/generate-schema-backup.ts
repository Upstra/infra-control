import 'dotenv/config';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

interface TableInfo {
  table_name: string;
  table_type: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  character_maximum_length: number | null;
  is_nullable: string;
  column_default: string | null;
  ordinal_position: number;
}

interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  column_name: string;
  foreign_table_name?: string;
  foreign_column_name?: string;
}

interface IndexInfo {
  indexname: string;
  indexdef: string;
}

interface SequenceInfo {
  sequence_name: string;
}

class SchemaBackupGenerator {
  private client: Client;
  private backupDir = 'backups';

  constructor() {
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'pg',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'root',
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('✓ Connected to database');
    } catch (error) {
      console.error('✗ Failed to connect to database:', error.message);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private formatDataType(column: ColumnInfo): string {
    let dataType = column.data_type;
    
    // Handle special PostgreSQL types
    switch (dataType) {
      case 'character varying':
        dataType = column.character_maximum_length 
          ? `varchar(${column.character_maximum_length})`
          : 'varchar';
        break;
      case 'timestamp without time zone':
        dataType = 'timestamp';
        break;
      case 'USER-DEFINED':
        // This is likely an enum or custom type
        dataType = 'varchar';
        break;
      case 'ARRAY':
        dataType = 'text[]';
        break;
    }
    
    return dataType;
  }

  private async getExtensions(): Promise<string[]> {
    const result = await this.client.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname != 'plpgsql'
      ORDER BY extname
    `);
    
    return result.rows.map(row => row.extname);
  }

  private async getSequences(): Promise<SequenceInfo[]> {
    const result = await this.client.query(`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `);
    
    return result.rows;
  }

  private async getTables(): Promise<TableInfo[]> {
    const result = await this.client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != 'migrations'
      ORDER BY table_name
    `);
    
    return result.rows;
  }

  private async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const result = await this.client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    return result.rows;
  }

  private async getTableConstraints(tableName: string): Promise<ConstraintInfo[]> {
    const result = await this.client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
      AND tc.table_name = $1
      ORDER BY tc.constraint_type, tc.constraint_name
    `, [tableName]);
    
    return result.rows;
  }

  private async getIndexes(): Promise<IndexInfo[]> {
    const result = await this.client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
      AND tablename != 'migrations'
      ORDER BY tablename, indexname
    `);
    
    return result.rows;
  }

  private generateCreateTable(
    tableName: string, 
    columns: ColumnInfo[], 
    constraints: ConstraintInfo[]
  ): string {
    let sql = `CREATE TABLE public."${tableName}" (\n`;
    
    // Add columns
    const columnDefs = columns.map(col => {
      let def = `    "${col.column_name}" ${this.formatDataType(col)}`;
      
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      
      return def;
    });
    
    // Add primary key constraint inline
    const primaryKeys = constraints.filter(c => c.constraint_type === 'PRIMARY KEY');
    if (primaryKeys.length > 0) {
      const pkColumns = primaryKeys.map(pk => `"${pk.column_name}"`).join(', ');
      const pkName = primaryKeys[0].constraint_name;
      columnDefs.push(`    CONSTRAINT "${pkName}" PRIMARY KEY (${pkColumns})`);
    }
    
    // Add unique constraints inline
    const uniqueConstraints = constraints.filter(c => c.constraint_type === 'UNIQUE');
    uniqueConstraints.forEach(uc => {
      columnDefs.push(`    CONSTRAINT "${uc.constraint_name}" UNIQUE ("${uc.column_name}")`);
    });
    
    sql += columnDefs.join(',\n');
    sql += '\n);\n';
    
    return sql;
  }

  private generateForeignKeys(tableName: string, constraints: ConstraintInfo[]): string[] {
    const foreignKeys = constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
    
    return foreignKeys.map(fk => 
      `ALTER TABLE ONLY public."${tableName}"\n` +
      `    ADD CONSTRAINT "${fk.constraint_name}" ` +
      `FOREIGN KEY ("${fk.column_name}") ` +
      `REFERENCES public."${fk.foreign_table_name}"("${fk.foreign_column_name}");`
    );
  }

  async generateBackup(): Promise<string> {
    console.log('Generating schema backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `schema_backup_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);
    
    await this.ensureBackupDirectory();
    
    let sql = '';
    
    // Header
    sql += `--
-- PostgreSQL Database Schema Backup
-- Generated: ${new Date().toISOString()}
-- Database: ${process.env.DB_NAME}
-- Host: ${process.env.DB_HOST}
-- Schema only (no data)
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

`;

    // Extensions
    const extensions = await this.getExtensions();
    for (const ext of extensions) {
      sql += `--
-- Name: ${ext}; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "${ext}" WITH SCHEMA public;

`;
    }

    // Sequences
    const sequences = await this.getSequences();
    for (const seq of sequences) {
      sql += `--
-- Name: ${seq.sequence_name}; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE IF NOT EXISTS public.${seq.sequence_name}
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

`;
    }

    // Tables
    const tables = await this.getTables();
    const foreignKeyStatements: string[] = [];
    
    console.log(`Found ${tables.length} tables to backup`);
    
    for (const table of tables) {
      const columns = await this.getTableColumns(table.table_name);
      const constraints = await this.getTableConstraints(table.table_name);
      
      sql += `--
-- Name: ${table.table_name}; Type: TABLE; Schema: public; Owner: -
--

`;
      sql += this.generateCreateTable(table.table_name, columns, constraints);
      sql += '\n';
      
      // Collect foreign keys for later
      foreignKeyStatements.push(...this.generateForeignKeys(table.table_name, constraints));
    }
    
    // Add all foreign keys
    if (foreignKeyStatements.length > 0) {
      sql += `--
-- Foreign Key Constraints
--

`;
      sql += foreignKeyStatements.join('\n\n');
      sql += '\n\n';
    }
    
    // Indexes
    const indexes = await this.getIndexes();
    if (indexes.length > 0) {
      sql += `--
-- Indexes
--

`;
      for (const idx of indexes) {
        sql += `${idx.indexdef};\n`;
      }
    }
    
    // Footer
    sql += `
--
-- PostgreSQL database schema dump complete
--
`;

    // Write to file
    await writeFile(filepath, sql, 'utf8');
    
    const stats = fs.statSync(filepath);
    const size = (stats.size / 1024).toFixed(2);
    
    console.log(`✓ Schema backup generated successfully!`);
    console.log(`  File: ${filepath}`);
    console.log(`  Size: ${size} KB`);
    console.log(`  Tables: ${tables.length}`);
    
    return filepath;
  }

  async cleanOldBackups(keepCount: number = 10): Promise<void> {
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('schema_backup_') && f.endsWith('.sql'))
      .map(f => ({
        name: f,
        path: path.join(this.backupDir, f),
        time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
      }
      console.log(`✓ Removed ${toDelete.length} old backup(s)`);
    }
  }
}

// Main execution
async function main() {
  const generator = new SchemaBackupGenerator();
  
  try {
    await generator.connect();
    const backupFile = await generator.generateBackup();
    await generator.cleanOldBackups();
    
    console.log('\nBackup completed successfully!');
    console.log('\nTo restore this schema to a new database:');
    console.log(`  psql -h [host] -U [user] -d [database] < ${backupFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await generator.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { SchemaBackupGenerator };