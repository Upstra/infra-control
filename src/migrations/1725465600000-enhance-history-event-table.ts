import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceHistoryEventTable1725465600000
  implements MigrationInterface
{
  name = 'EnhanceHistoryEventTable1725465600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "history_event" 
      ADD COLUMN "oldValue" jsonb,
      ADD COLUMN "newValue" jsonb,
      ADD COLUMN "metadata" jsonb,
      ADD COLUMN "ipAddress" varchar,
      ADD COLUMN "userAgent" varchar,
      ADD COLUMN "correlationId" varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "history_event"
      DROP COLUMN "oldValue",
      DROP COLUMN "newValue", 
      DROP COLUMN "metadata",
      DROP COLUMN "ipAddress",
      DROP COLUMN "userAgent",
      DROP COLUMN "correlationId"
    `);
  }
}
