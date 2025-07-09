import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupUserPreferencesConstraints1752100192730 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove orphaned user_preferences records
        await queryRunner.query(`
            DELETE FROM user_preferences 
            WHERE user_id IS NULL 
            OR user_id NOT IN (SELECT id FROM "user")
        `);
        
        // Drop existing foreign key if it exists
        await queryRunner.query(`
            ALTER TABLE user_preferences 
            DROP CONSTRAINT IF EXISTS FK_user_preferences_user
        `);
        
        // Make user_id NOT NULL if it isn't already
        await queryRunner.query(`
            ALTER TABLE user_preferences 
            ALTER COLUMN user_id SET NOT NULL
        `);
        
        // Add unique constraint if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'UQ_user_preferences_user_id'
                ) THEN
                    ALTER TABLE user_preferences 
                    ADD CONSTRAINT UQ_user_preferences_user_id UNIQUE (user_id);
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove unique constraint
        await queryRunner.query(`
            ALTER TABLE user_preferences 
            DROP CONSTRAINT IF EXISTS UQ_user_preferences_user_id
        `);
        
        // Make user_id nullable
        await queryRunner.query(`
            ALTER TABLE user_preferences 
            ALTER COLUMN user_id DROP NOT NULL
        `);
    }

}
