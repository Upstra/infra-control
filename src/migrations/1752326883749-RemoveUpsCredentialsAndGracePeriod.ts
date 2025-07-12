import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUpsCredentialsAndGracePeriod1752326883749 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove login, password, grace_period_on, and grace_period_off columns from ups table
        await queryRunner.query(`ALTER TABLE "ups" DROP COLUMN "login"`);
        await queryRunner.query(`ALTER TABLE "ups" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "ups" DROP COLUMN "grace_period_on"`);
        await queryRunner.query(`ALTER TABLE "ups" DROP COLUMN "grace_period_off"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-add the removed columns if migration needs to be reverted
        await queryRunner.query(`ALTER TABLE "ups" ADD "grace_period_off" integer NOT NULL DEFAULT 30`);
        await queryRunner.query(`ALTER TABLE "ups" ADD "grace_period_on" integer NOT NULL DEFAULT 60`);
        await queryRunner.query(`ALTER TABLE "ups" ADD "password" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "ups" ADD "login" character varying NOT NULL DEFAULT ''`);
    }

}
