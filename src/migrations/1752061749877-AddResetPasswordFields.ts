import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetPasswordFields1752061749877 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "resetPasswordToken" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "resetPasswordExpiry" timestamp`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_resetPasswordToken" ON "user" ("resetPasswordToken")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_resetPasswordToken"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "resetPasswordExpiry"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "resetPasswordToken"`,
    );
  }
}
