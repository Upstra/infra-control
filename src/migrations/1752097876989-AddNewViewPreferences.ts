import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewViewPreferences1752097876989 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update existing display column to add new view preferences
    await queryRunner.query(`
      UPDATE user_preferences
      SET display = jsonb_set(
        jsonb_set(
          jsonb_set(
            display,
            '{defaultUpsView}',
            '"grid"'::jsonb
          ),
          '{defaultRoomView}',
          '"grid"'::jsonb
        ),
        '{defaultGroupView}',
        '"grid"'::jsonb
      )
      WHERE display IS NOT NULL
    `);

    // Update default value for new records
    await queryRunner.query(`
      ALTER TABLE user_preferences
      ALTER COLUMN display
      SET DEFAULT '{"defaultUserView": "table", "defaultServerView": "grid", "defaultUpsView": "grid", "defaultRoomView": "grid", "defaultGroupView": "grid", "compactMode": false}'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the new fields from existing records
    await queryRunner.query(`
      UPDATE user_preferences
      SET display = display - 'defaultUpsView' - 'defaultRoomView' - 'defaultGroupView'
      WHERE display IS NOT NULL
    `);

    // Restore original default value
    await queryRunner.query(`
      ALTER TABLE user_preferences
      ALTER COLUMN display
      SET DEFAULT '{"defaultUserView": "table", "defaultServerView": "grid", "compactMode": false}'::jsonb
    `);
  }
}
