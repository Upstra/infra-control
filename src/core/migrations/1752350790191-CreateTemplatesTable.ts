import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTemplatesTable1752350790191 implements MigrationInterface {
    name = 'CreateTemplatesTable1752350790191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."templates_type_enum" AS ENUM('predefined', 'custom')
        `);
        await queryRunner.query(`
            CREATE TABLE "templates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "type" "public"."templates_type_enum" NOT NULL DEFAULT 'custom',
                "configuration" jsonb NOT NULL,
                "createdBy" character varying(255) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_templates_name" UNIQUE ("name"),
                CONSTRAINT "PK_templates_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "templates"`);
        await queryRunner.query(`DROP TYPE "public"."templates_type_enum"`);
    }

}
