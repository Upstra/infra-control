# Database Schema Backup Scripts

This directory contains scripts to generate schema-only backups of the database.

## Available Scripts

### 1. TypeScript Version (Recommended)
No external dependencies required, uses Node.js and pg client.

```bash
# Using npm script
pnpm schema:backup

# Or run directly
ts-node scripts/generate-schema-backup.ts
```

### 2. Shell Script Version
Requires `pg_dump` to be installed.

```bash
# Using npm script
pnpm schema:backup:sh

# Or run directly
./scripts/generate-schema-backup.sh
```

## Features

- **Schema-only backup**: Exports table structures, constraints, indexes, and sequences without data
- **Automatic cleanup**: Keeps only the last 10 backups
- **PostgreSQL compatible**: Generates standard PostgreSQL SQL dumps
- **Environment aware**: Uses `.env` file for database configuration
- **Cross-platform**: TypeScript version works on any OS with Node.js

## Output

Backups are saved in the `backups/` directory with timestamps:
- `backups/schema_backup_YYYYMMDD_HHMMSS.sql`

## Usage in Production

1. Generate a schema backup:
   ```bash
   pnpm schema:backup
   ```

2. Copy the backup file to your production server

3. Restore the schema:
   ```bash
   psql -h localhost -U postgres -d your_database < backups/schema_backup_*.sql
   ```

## Configuration

The scripts use the following environment variables from `.env`:
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_NAME` (default: pg)
- `DB_USERNAME` (default: root)
- `DB_PASSWORD` (default: root)

## Differences from TypeORM Migrations

- **SQL Dumps**: These scripts generate pure SQL files that can be executed directly
- **TypeORM Migrations**: Use TypeScript/JavaScript and the TypeORM query runner
- **Use Case**: SQL dumps are better for production deployments and disaster recovery

## Troubleshooting

### pg_dump not found (Shell script only)
Install PostgreSQL client tools:
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql-client`
- Windows: Install PostgreSQL and add to PATH

### Connection refused
Check that your database is running and credentials in `.env` are correct.

### Permission denied
Make sure the shell script is executable:
```bash
chmod +x scripts/generate-schema-backup.sh
```