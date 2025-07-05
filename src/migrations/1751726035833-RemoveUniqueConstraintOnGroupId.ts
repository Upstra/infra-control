import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUniqueConstraintOnGroupId1751726035833
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove any unique constraint on group_id in server table
    await queryRunner.query(`
            DO $$ 
            BEGIN
                -- Drop unique constraint if it exists
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_type = 'UNIQUE' 
                    AND table_name = 'server' 
                    AND constraint_name LIKE '%group_id%'
                ) THEN
                    EXECUTE (
                        SELECT 'ALTER TABLE server DROP CONSTRAINT ' || constraint_name 
                        FROM information_schema.table_constraints 
                        WHERE constraint_type = 'UNIQUE' 
                        AND table_name = 'server' 
                        AND constraint_name LIKE '%group_id%'
                        LIMIT 1
                    );
                END IF;
                
                -- Drop unique index if it exists
                IF EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = 'server' 
                    AND indexname LIKE '%group_id%' 
                    AND indexdef LIKE '%UNIQUE%'
                ) THEN
                    EXECUTE (
                        SELECT 'DROP INDEX ' || indexname 
                        FROM pg_indexes 
                        WHERE tablename = 'server' 
                        AND indexname LIKE '%group_id%' 
                        AND indexdef LIKE '%UNIQUE%'
                        LIMIT 1
                    );
                END IF;
            END $$;
        `);

    // Same for VM table
    await queryRunner.query(`
            DO $$ 
            BEGIN
                -- Drop unique constraint if it exists
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_type = 'UNIQUE' 
                    AND table_name = 'vm' 
                    AND constraint_name LIKE '%group_id%'
                ) THEN
                    EXECUTE (
                        SELECT 'ALTER TABLE vm DROP CONSTRAINT ' || constraint_name 
                        FROM information_schema.table_constraints 
                        WHERE constraint_type = 'UNIQUE' 
                        AND table_name = 'vm' 
                        AND constraint_name LIKE '%group_id%'
                        LIMIT 1
                    );
                END IF;
                
                -- Drop unique index if it exists
                IF EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = 'vm' 
                    AND indexname LIKE '%group_id%' 
                    AND indexdef LIKE '%UNIQUE%'
                ) THEN
                    EXECUTE (
                        SELECT 'DROP INDEX ' || indexname 
                        FROM pg_indexes 
                        WHERE tablename = 'vm' 
                        AND indexname LIKE '%group_id%' 
                        AND indexdef LIKE '%UNIQUE%'
                        LIMIT 1
                    );
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We don't want to recreate the unique constraints in rollback
    // as they shouldn't exist in the first place
  }
}
