import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVMwareFieldsToVm1752272365928 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "vm" 
            ADD COLUMN "moid" varchar,
            ADD COLUMN "guestOs" varchar,
            ADD COLUMN "guestFamily" varchar,
            ADD COLUMN "version" varchar,
            ADD COLUMN "createDate" timestamp,
            ADD COLUMN "numCoresPerSocket" integer,
            ADD COLUMN "numCPU" integer,
            ADD COLUMN "esxiHostName" varchar,
            ADD COLUMN "esxiHostMoid" varchar,
            ALTER COLUMN "os" DROP NOT NULL,
            ALTER COLUMN "adminUrl" DROP NOT NULL,
            ALTER COLUMN "ip" DROP NOT NULL,
            ALTER COLUMN "login" DROP NOT NULL,
            ALTER COLUMN "password" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "vm" 
            DROP COLUMN "moid",
            DROP COLUMN "guestOs",
            DROP COLUMN "guestFamily",
            DROP COLUMN "version",
            DROP COLUMN "createDate",
            DROP COLUMN "numCoresPerSocket",
            DROP COLUMN "numCPU",
            DROP COLUMN "esxiHostName",
            DROP COLUMN "esxiHostMoid",
            ALTER COLUMN "os" SET NOT NULL,
            ALTER COLUMN "adminUrl" SET NOT NULL,
            ALTER COLUMN "ip" SET NOT NULL,
            ALTER COLUMN "login" SET NOT NULL,
            ALTER COLUMN "password" SET NOT NULL
        `);
  }
}
