import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupFieldsAndRelations1751559629881
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to group_server table
    await queryRunner.query(
      `ALTER TABLE "group_server" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_server" ADD "cascade" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "group_server" ADD "roomId" uuid`);

    // Add new columns to group_vm table
    await queryRunner.query(
      `ALTER TABLE "group_vm" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_vm" ADD "cascade" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "group_vm" ADD "roomId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "group_vm" ADD "serverGroupId" uuid NOT NULL`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "group_server" ADD CONSTRAINT "FK_group_server_room" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_vm" ADD CONSTRAINT "FK_group_vm_room" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_vm" ADD CONSTRAINT "FK_group_vm_server_group" FOREIGN KEY ("serverGroupId") REFERENCES "group_server"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "group_vm" DROP CONSTRAINT "FK_group_vm_server_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_vm" DROP CONSTRAINT "FK_group_vm_room"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_server" DROP CONSTRAINT "FK_group_server_room"`,
    );

    // Drop columns from group_vm table
    await queryRunner.query(
      `ALTER TABLE "group_vm" DROP COLUMN "serverGroupId"`,
    );
    await queryRunner.query(`ALTER TABLE "group_vm" DROP COLUMN "roomId"`);
    await queryRunner.query(`ALTER TABLE "group_vm" DROP COLUMN "cascade"`);
    await queryRunner.query(`ALTER TABLE "group_vm" DROP COLUMN "description"`);

    // Drop columns from group_server table
    await queryRunner.query(`ALTER TABLE "group_server" DROP COLUMN "roomId"`);
    await queryRunner.query(`ALTER TABLE "group_server" DROP COLUMN "cascade"`);
    await queryRunner.query(
      `ALTER TABLE "group_server" DROP COLUMN "description"`,
    );
  }
}
