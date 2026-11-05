import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertTables1762286400000 implements MigrationInterface {
  name = 'CreateAlertTables1762286400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."alert_severity_enum" AS ENUM('critical', 'warning', 'info')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_status_enum" AS ENUM('open', 'resolved')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_resourcetype_enum" AS ENUM('ups', 'server', 'vm', 'room')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dedupKey" character varying NOT NULL, "type" character varying NOT NULL, "severity" "public"."alert_severity_enum" NOT NULL, "status" "public"."alert_status_enum" NOT NULL DEFAULT 'open', "resourceType" "public"."alert_resourcetype_enum" NOT NULL, "resourceId" uuid NOT NULL, "resourceName" character varying NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "details" jsonb, "openedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL, "resolvedAt" TIMESTAMP WITH TIME ZONE, "acknowledgedAt" TIMESTAMP WITH TIME ZONE, "acknowledgedById" uuid, "occurrences" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_ad91cad659a3536465d564a4b2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_status_severity_opened_at" ON "alert" ("status", "severity", "openedAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_alert_open_dedup_key" ON "alert" ("dedupKey") WHERE "status" = 'open'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_transition_type_enum" AS ENUM('opened', 'escalated', 'deescalated', 'acknowledged', 'unacknowledged', 'resolved')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_transition_fromseverity_enum" AS ENUM('critical', 'warning', 'info')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_transition_toseverity_enum" AS ENUM('critical', 'warning', 'info')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_transition" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "alertId" uuid NOT NULL, "type" "public"."alert_transition_type_enum" NOT NULL, "at" TIMESTAMP WITH TIME ZONE NOT NULL, "byUserId" uuid, "fromSeverity" "public"."alert_transition_fromseverity_enum", "toSeverity" "public"."alert_transition_toseverity_enum", CONSTRAINT "PK_a4ae4b6f565dd07e704062f3884" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_transition_at" ON "alert_transition" ("at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" ADD CONSTRAINT "FK_170c585def2f2859edaf311d9da" FOREIGN KEY ("acknowledgedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_transition" ADD CONSTRAINT "FK_ec684cc03617e192d491e9e33a0" FOREIGN KEY ("alertId") REFERENCES "alert"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_transition" ADD CONSTRAINT "FK_1c676d63c64175d0767de41947a" FOREIGN KEY ("byUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_transition" DROP CONSTRAINT "FK_1c676d63c64175d0767de41947a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_transition" DROP CONSTRAINT "FK_ec684cc03617e192d491e9e33a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert" DROP CONSTRAINT "FK_170c585def2f2859edaf311d9da"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_alert_transition_at"`);
    await queryRunner.query(`DROP TABLE "alert_transition"`);
    await queryRunner.query(
      `DROP TYPE "public"."alert_transition_toseverity_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."alert_transition_fromseverity_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."alert_transition_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_alert_open_dedup_key"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_alert_status_severity_opened_at"`,
    );
    await queryRunner.query(`DROP TABLE "alert"`);
    await queryRunner.query(`DROP TYPE "public"."alert_resourcetype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."alert_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."alert_severity_enum"`);
  }
}
