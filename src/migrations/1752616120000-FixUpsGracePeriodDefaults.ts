import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUpsGracePeriodDefaults1752616120000 implements MigrationInterface {
  name = 'FixUpsGracePeriodDefaults1752616120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update any NULL values to default values
    await queryRunner.query(`UPDATE "ups" SET "grace_period_on" = 30 WHERE "grace_period_on" IS NULL`);
    await queryRunner.query(`UPDATE "ups" SET "grace_period_off" = 30 WHERE "grace_period_off" IS NULL`);
    
    // Then, alter the columns to be NOT NULL with defaults
    await queryRunner.query(`ALTER TABLE "ups" ALTER COLUMN "grace_period_on" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "ups" ALTER COLUMN "grace_period_off" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "ups" ALTER COLUMN "grace_period_on" SET DEFAULT 30`);
    await queryRunner.query(`ALTER TABLE "ups" ALTER COLUMN "grace_period_off" SET DEFAULT 30`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ups" ALTER COLUMN "grace_period_off" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "ups" ALTER COLUMN "grace_period_on" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "ups" ALTER COLUMN "grace_period_off" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "ups" ALTER COLUMN "grace_period_on" DROP NOT NULL`);
  }
}