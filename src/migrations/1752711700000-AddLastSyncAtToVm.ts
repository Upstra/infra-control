import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastSyncAtToVm1752711700000 implements MigrationInterface {
  name = 'AddLastSyncAtToVm1752711700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vm" ADD "lastSyncAt" TIMESTAMP NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vm" DROP COLUMN "lastSyncAt"`);
  }
}
