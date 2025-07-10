import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateUserPreferencesTable1752086121427
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_preferences',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'locale',
            type: 'enum',
            enum: ['fr', 'en'],
            default: "'fr'",
          },
          {
            name: 'theme',
            type: 'enum',
            enum: ['light', 'dark'],
            default: "'dark'",
          },
          {
            name: 'timezone',
            type: 'varchar',
            default: "'UTC'",
          },
          {
            name: 'notifications',
            type: 'jsonb',
            default: `'{"server": true, "ups": true, "email": false, "push": true}'::jsonb`,
          },
          {
            name: 'display',
            type: 'jsonb',
            default: `'{"defaultUserView": "table", "defaultServerView": "grid", "compactMode": false}'::jsonb`,
          },
          {
            name: 'integrations',
            type: 'jsonb',
            default: `'{}'::jsonb`,
          },
          {
            name: 'performance',
            type: 'jsonb',
            default: `'{"autoRefresh": true, "refreshInterval": 60}'::jsonb`,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_preferences',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_preferences');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    await queryRunner.dropForeignKey('user_preferences', foreignKey);
    await queryRunner.dropTable('user_preferences');
  }
}
