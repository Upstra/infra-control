import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSystemSettingsTable1752138124959
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'system_settings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: "'singleton'",
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['updated_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    const defaultSettings = {
      security: {
        registrationEnabled: true,
        requireEmailVerification: false,
        defaultUserRole: 'user',
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
        },
        allowGuestAccess: false,
      },
      system: {
        maintenanceMode: false,
        maintenanceMessage: '',
        maxUploadSize: 10,
        allowedFileTypes: ['jpg', 'png', 'pdf', 'docx'],
        api: {
          enabled: true,
          rateLimit: 100,
        },
        enableWebSockets: true,
      },
      email: {
        enabled: false,
        smtp: {
          host: '',
          port: 587,
          secure: true,
          user: '',
        },
        from: {
          name: 'Upstra',
          address: 'noreply@upstra.io',
        },
      },
      backup: {
        enabled: false,
        schedule: {
          interval: 24,
          retention: 30,
        },
        storage: {
          type: 'local',
        },
      },
      logging: {
        level: 'info',
        retention: 7,
        metrics: {
          enabled: true,
          retention: 30,
        },
      },
    };

    await queryRunner.query(
      `INSERT INTO system_settings (id, settings) VALUES ('singleton', $1)`,
      [JSON.stringify(defaultSettings)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('system_settings');
  }
}
