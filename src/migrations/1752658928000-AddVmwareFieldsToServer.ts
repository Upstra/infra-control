import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVmwareFieldsToServer1752658928000
  implements MigrationInterface
{
  name = 'AddVmwareFieldsToServer1752658928000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "server" ADD "vmwareVCenterIp" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD "vmwareCluster" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD "vmwareVendor" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD "vmwareModel" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD "vmwareCpuCores" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD "vmwareCpuThreads" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD "vmwareCpuMHz" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD "vmwareRamTotal" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "server" DROP COLUMN "vmwareRamTotal"`,
    );
    await queryRunner.query(`ALTER TABLE "server" DROP COLUMN "vmwareCpuMHz"`);
    await queryRunner.query(
      `ALTER TABLE "server" DROP COLUMN "vmwareCpuThreads"`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" DROP COLUMN "vmwareCpuCores"`,
    );
    await queryRunner.query(`ALTER TABLE "server" DROP COLUMN "vmwareModel"`);
    await queryRunner.query(`ALTER TABLE "server" DROP COLUMN "vmwareVendor"`);
    await queryRunner.query(`ALTER TABLE "server" DROP COLUMN "vmwareCluster"`);
    await queryRunner.query(
      `ALTER TABLE "server" DROP COLUMN "vmwareVCenterIp"`,
    );
  }
}
