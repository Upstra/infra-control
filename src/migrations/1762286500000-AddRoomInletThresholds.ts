import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoomInletThresholds1762286500000 implements MigrationInterface {
  name = 'AddRoomInletThresholds1762286500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room" ADD "inletWarnC" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "room" ADD "inletCritC" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "inletCritC"`);
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "inletWarnC"`);
  }
}
