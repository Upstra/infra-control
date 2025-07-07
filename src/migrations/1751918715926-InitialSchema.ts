import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1751918715926 implements MigrationInterface {
  name = 'InitialSchema1751918715926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create sequences
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS dashboard_templates_id_seq`,
    );
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS role_id_seq`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS permission_id_seq`);

    // Create tables and constraints
    await queryRunner.query(`CREATE TABLE "dashboard_layouts" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "name" varchar(255) NOT NULL,
  "columns" integer DEFAULT 12 NOT NULL,
  "row_height" integer DEFAULT 80 NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(
      `ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "FK_ddcbe1e4b5bca76d3a72ff21860" FOREIGN KEY ("user_id") REFERENCES "user"("id");`,
    );
    await queryRunner.query(`CREATE TABLE "dashboard_preferences" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "user_id" uuid NOT NULL,
  "default_layout_id" uuid,
  "refresh_interval" integer DEFAULT 30000 NOT NULL,
  "theme" varchar(20) DEFAULT 'light'::character varying NOT NULL,
  "notifications" jsonb DEFAULT '{"alerts": true, "activities": false}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(
      `ALTER TABLE "dashboard_preferences" ADD CONSTRAINT "FK_280fe6e94d2968dead6828ccce3" FOREIGN KEY ("user_id") REFERENCES "user"("id");`,
    );
    await queryRunner.query(`CREATE TABLE "dashboard_templates" (
  "id" integer DEFAULT nextval('dashboard_templates_id_seq'::regclass) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "preview" varchar(500),
  "widgets" jsonb NOT NULL,
  "columns" integer DEFAULT 12 NOT NULL,
  "row_height" integer DEFAULT 80 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(`CREATE TABLE "dashboard_widgets" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "type" varchar NOT NULL,
  "title" varchar(255) NOT NULL,
  "position" jsonb NOT NULL,
  "settings" jsonb,
  "refresh_interval" integer,
  "visible" boolean DEFAULT true NOT NULL,
  "layout_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(
      `ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "FK_34ec67535e1a5c78ce512d8702c" FOREIGN KEY ("layout_id") REFERENCES "dashboard_layouts"("id");`,
    );
    await queryRunner.query(`CREATE TABLE "groups" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "type" varchar NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(`CREATE TABLE "history_event" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "entity" varchar NOT NULL,
  "entityId" varchar NOT NULL,
  "action" varchar NOT NULL,
  "userId" uuid,
  "oldValue" jsonb,
  "newValue" jsonb,
  "metadata" jsonb,
  "ipAddress" varchar,
  "userAgent" varchar,
  "correlationId" varchar,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(
      `ALTER TABLE "history_event" ADD CONSTRAINT "FK_2f9dbf5a1d7c6c471fd45d8bc6d" FOREIGN KEY ("userId") REFERENCES "user"("id");`,
    );
    await queryRunner.query(`CREATE TABLE "ilo" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "name" varchar NOT NULL,
  "ip" varchar NOT NULL,
  "login" varchar NOT NULL,
  "password" varchar NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(`CREATE TABLE "permission_server" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "roleId" uuid NOT NULL,
  "bitmask" integer DEFAULT 0 NOT NULL,
  "serverId" uuid,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(
      `ALTER TABLE "permission_server" ADD CONSTRAINT "FK_e6e4b1fda3cf0b1fff9a15900b8" FOREIGN KEY ("roleId") REFERENCES "role"("id");`,
    );
    await queryRunner.query(
      `ALTER TABLE "permission_server" ADD CONSTRAINT "FK_d8106026a47302b3af6379c25a2" FOREIGN KEY ("serverId") REFERENCES "server"("id");`,
    );
    await queryRunner.query(`CREATE TABLE "permission_vm" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "roleId" uuid NOT NULL,
  "bitmask" integer DEFAULT 0 NOT NULL,
  "vmId" uuid,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(
      `ALTER TABLE "permission_vm" ADD CONSTRAINT "FK_12fdfb375f0126cafdba33ee849" FOREIGN KEY ("roleId") REFERENCES "role"("id");`,
    );
    await queryRunner.query(
      `ALTER TABLE "permission_vm" ADD CONSTRAINT "FK_bfbb61f8f1d593b59375858c276" FOREIGN KEY ("vmId") REFERENCES "vm"("id");`,
    );
    await queryRunner.query(`CREATE TABLE "role" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "name" varchar NOT NULL,
  "canCreateServer" boolean DEFAULT false NOT NULL,
  "isAdmin" boolean DEFAULT false NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(`CREATE TABLE "room" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "name" varchar NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(`CREATE TABLE "server" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "name" varchar NOT NULL,
  "state" varchar NOT NULL,
  "grace_period_on" integer NOT NULL,
  "grace_period_off" integer NOT NULL,
  "adminUrl" varchar NOT NULL,
  "ip" varchar NOT NULL,
  "login" varchar NOT NULL,
  "password" varchar NOT NULL,
  "type" varchar NOT NULL,
  "priority" integer NOT NULL,
  "group_id" uuid,
  "roomId" uuid,
  "upsId" uuid,
  "iloId" uuid,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(
      `ALTER TABLE "server" ADD CONSTRAINT "FK_930179be61799a196d0704cd907" FOREIGN KEY ("group_id") REFERENCES "groups"("id");`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD CONSTRAINT "FK_e4df170ae4c236d2005844e9076" FOREIGN KEY ("roomId") REFERENCES "room"("id");`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD CONSTRAINT "FK_be433e1eb33b226b5da737f5424" FOREIGN KEY ("upsId") REFERENCES "ups"("id");`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD CONSTRAINT "FK_f83b474ec058a91f8eda9f261d0" FOREIGN KEY ("iloId") REFERENCES "ilo"("id");`,
    );
    await queryRunner.query(`CREATE TABLE "setup_progress" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "step" varchar NOT NULL,
  "completedAt" timestamp NOT NULL,
  "completedBy" varchar NOT NULL,
  "metadata" json,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(`CREATE TABLE "ups" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "name" varchar NOT NULL,
  "ip" varchar NOT NULL,
  "login" varchar NOT NULL,
  "password" varchar NOT NULL,
  "grace_period_on" integer NOT NULL,
  "grace_period_off" integer NOT NULL,
  "roomId" uuid NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(
      `ALTER TABLE "ups" ADD CONSTRAINT "FK_05d137f99b386620e64d51f341c" FOREIGN KEY ("roomId") REFERENCES "room"("id");`,
    );
    await queryRunner.query(`CREATE TABLE "user" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "username" varchar NOT NULL,
  "firstName" varchar(100) NOT NULL,
  "lastName" varchar(100) NOT NULL,
  "password" varchar NOT NULL,
  "email" varchar,
  "isTwoFactorEnabled" boolean DEFAULT false NOT NULL,
  "twoFactorSecret" varchar,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "lastLoggedIn" timestamp,
  "recoveryCodes" ARRAY,
  "active" boolean DEFAULT false NOT NULL,
  "deleted" boolean DEFAULT false NOT NULL,
  "deletedAt" timestamp,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(`CREATE TABLE "user_roles" (
  "userId" uuid NOT NULL,
  "roleId" uuid NOT NULL,
  PRIMARY KEY ("userId", "userId", "roleId", "roleId")
);`);
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES "user"("id");`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "role"("id");`,
    );
    await queryRunner.query(`CREATE TABLE "vm" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "name" varchar NOT NULL,
  "state" varchar NOT NULL,
  "grace_period_on" integer NOT NULL,
  "grace_period_off" integer NOT NULL,
  "os" varchar NOT NULL,
  "adminUrl" varchar NOT NULL,
  "ip" varchar NOT NULL,
  "login" varchar NOT NULL,
  "password" varchar NOT NULL,
  "priority" integer NOT NULL,
  "group_id" uuid,
  "serverId" uuid NOT NULL,
  PRIMARY KEY ("id")
);`);
    await queryRunner.query(
      `ALTER TABLE "vm" ADD CONSTRAINT "FK_ba05bdb9ba2dc67b899830fd83d" FOREIGN KEY ("group_id") REFERENCES "groups"("id");`,
    );
    await queryRunner.query(
      `ALTER TABLE "vm" ADD CONSTRAINT "FK_c22deb8aa9293793c5c12650908" FOREIGN KEY ("serverId") REFERENCES "server"("id");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_1850c429674a715d8cb13769efb" ON public.dashboard_layouts USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_7fe68b766b0745c53bf95895d9f" ON public.dashboard_preferences USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_280fe6e94d2968dead6828ccce3" ON public.dashboard_preferences USING btree (user_id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_6c71c37f6487e2ed41a4de7212d" ON public.dashboard_templates USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_17a92cc2e48efc2a3c168eec6b8" ON public.dashboard_templates USING btree (name);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_a77038e4644617970badd975284" ON public.dashboard_widgets USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_659d1483316afb28afd3a90646e" ON public.groups USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_664ea405ae2a10c264d582ee563" ON public.groups USING btree (name);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_7fbfa45c0a68854e44cba8c6497" ON public.history_event USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_39b1ea0a330f51afb14de8b9508" ON public.ilo USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_ccf720167f56f51a66b3475a63b" ON public.permission_server USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_3c8690909447513028dc02361e0" ON public.permission_vm USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_b36bcfe02fc8de3c57a8b2391c2" ON public.role USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_c6d46db005d623e691b2fbcba23" ON public.room USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_f8b8af38bdc23b447c0a57c7937" ON public.server USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "REL_f83b474ec058a91f8eda9f261d" ON public.server USING btree ("iloId");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_c3980a47e3be508ba479409ed62" ON public.server USING btree (ip);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_87d342514e0b5b68559ce5afee7" ON public.setup_progress USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_5f9511c6880d95b37867142d317" ON public.ups USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_540e343c3a99241274caeda3c0a" ON public.ups USING btree (ip);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_cace4a159ff9f2512dd42373760" ON public."user" USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_78a916df40e02a9deb1c4b75edb" ON public."user" USING btree (username);`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_472b25323af01488f1f66a06b6" ON public.user_roles USING btree ("userId");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86033897c009fcca8b6505d6be" ON public.user_roles USING btree ("roleId");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_88481b0c4ed9ada47e9fdd67475" ON public.user_roles USING btree ("userId", "roleId");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "PK_3111768eccf1e167186faefd138" ON public.vm USING btree (id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_e50fb323d0474977f2553f160f7" ON public.vm USING btree (ip);;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "vm" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ups" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "setup_progress" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "server" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "room" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_vm" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_server" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ilo" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "history_event" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "groups" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_widgets" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "dashboard_templates" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "dashboard_preferences" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_layouts" CASCADE`);

    // Drop sequences
    await queryRunner.query(`DROP SEQUENCE IF EXISTS permission_id_seq`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS role_id_seq`);
    await queryRunner.query(
      `DROP SEQUENCE IF EXISTS dashboard_templates_id_seq`,
    );

    // Drop extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
