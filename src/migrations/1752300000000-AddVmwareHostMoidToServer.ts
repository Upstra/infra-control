import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVmwareHostMoidToServer1752300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "server" 
      ADD COLUMN "vmwareHostMoid" varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "server" 
      DROP COLUMN "vmwareHostMoid"
    `);
  }
}
