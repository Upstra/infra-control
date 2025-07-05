import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergeGroupTables1751644208200 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE group_type AS ENUM ('VM', 'SERVER');
    `);

    await queryRunner.query(`
      CREATE TABLE "groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "type" group_type NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_groups" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_groups_name" UNIQUE ("name")
      );
    `);

    await queryRunner.query(`CREATE INDEX IDX_groups_type ON groups(type)`);
    await queryRunner.query(
      `CREATE INDEX IDX_groups_is_active ON groups(is_active)`,
    );

    await queryRunner.query(`
      INSERT INTO groups (id, name, description, type, is_active, created_at, updated_at, created_by, updated_by)
      SELECT id, name, description, 'VM'::group_type, is_active, created_at, updated_at, created_by, updated_by
      FROM group_vms;
    `);

    await queryRunner.query(`
      INSERT INTO groups (id, name, description, type, is_active, created_at, updated_at, created_by, updated_by)
      SELECT id, name, description, 'SERVER'::group_type, is_active, created_at, updated_at, created_by, updated_by
      FROM group_servers;
    `);

    await queryRunner.query(`ALTER TABLE vms ADD COLUMN group_id uuid`);
    await queryRunner.query(
      `UPDATE vms SET group_id = group_vm_id WHERE group_vm_id IS NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE servers ADD COLUMN group_id uuid`);
    await queryRunner.query(
      `UPDATE servers SET group_id = group_server_id WHERE group_server_id IS NOT NULL`,
    );

    await queryRunner.query(`
      ALTER TABLE vms 
      ADD CONSTRAINT FK_vms_group 
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE servers 
      ADD CONSTRAINT FK_servers_group 
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(
      `ALTER TABLE vms DROP CONSTRAINT IF EXISTS FK_vms_group_vm`,
    );
    await queryRunner.query(
      `ALTER TABLE servers DROP CONSTRAINT IF EXISTS FK_servers_group_server`,
    );

    await queryRunner.query(
      `ALTER TABLE vms DROP COLUMN IF EXISTS group_vm_id`,
    );
    await queryRunner.query(
      `ALTER TABLE servers DROP COLUMN IF EXISTS group_server_id`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS group_server_group_vm`);

    await queryRunner.query(`DROP TABLE IF EXISTS group_vms`);
    await queryRunner.query(`DROP TABLE IF EXISTS group_servers`);
  }

  public async down(_: QueryRunner): Promise<void> {
    throw new Error('Rollback not implemented - restore from backup');
  }
}
