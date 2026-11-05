import { MigrationInterface, QueryRunner } from 'typeorm';

const BASELINE_QUERIES: string[] = [
  'CREATE TABLE "permission_vm" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "roleId" uuid NOT NULL, "bitmask" integer NOT NULL DEFAULT \'0\', "vmId" uuid, CONSTRAINT "PK_3c8690909447513028dc02361e0" PRIMARY KEY ("id"))',
  'CREATE TABLE "vm" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "moid" character varying, "state" character varying NOT NULL, "grace_period_on" integer NOT NULL, "grace_period_off" integer NOT NULL, "os" character varying, "guestOs" character varying, "guestFamily" character varying, "version" character varying, "createDate" TIMESTAMP, "numCoresPerSocket" integer, "numCPU" integer, "esxiHostName" character varying, "esxiHostMoid" character varying, "adminUrl" character varying, "ip" character varying, "login" character varying, "password" character varying, "priority" integer NOT NULL, "group_id" uuid, "serverId" uuid NOT NULL, "lastSyncAt" TIMESTAMP, CONSTRAINT "PK_3111768eccf1e167186faefd138" PRIMARY KEY ("id"))',
  'CREATE UNIQUE INDEX "IDX_36c501a46d2820f5899480db12" ON "vm" ("moid", "serverId") WHERE moid IS NOT NULL',
  'CREATE TYPE "public"."group_type" AS ENUM(\'VM\', \'SERVER\')',
  'CREATE TABLE "groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "type" "public"."group_type" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, CONSTRAINT "UQ_664ea405ae2a10c264d582ee563" UNIQUE ("name"), CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))',
  'CREATE TABLE "ups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ip" character varying NOT NULL, "grace_period_on" integer NOT NULL, "grace_period_off" integer NOT NULL, "roomId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_540e343c3a99241274caeda3c0a" UNIQUE ("ip"), CONSTRAINT "PK_5f9511c6880d95b37867142d317" PRIMARY KEY ("id"))',
  'CREATE TABLE "room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id"))',
  'CREATE TABLE "ilo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ip" character varying NOT NULL, "login" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_39b1ea0a330f51afb14de8b9508" PRIMARY KEY ("id"))',
  'CREATE TABLE "server" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "state" character varying NOT NULL, "adminUrl" character varying NOT NULL, "ip" character varying NOT NULL, "login" character varying NOT NULL, "password" character varying NOT NULL, "type" character varying NOT NULL, "priority" integer NOT NULL, "group_id" uuid, "roomId" uuid, "upsId" uuid, "iloId" uuid, "vmwareHostMoid" character varying, "vmwareVCenterIp" character varying, "vmwareCluster" character varying, "vmwareVendor" character varying, "vmwareModel" character varying, "vmwareCpuCores" integer, "vmwareCpuThreads" integer, "vmwareCpuMHz" double precision, "vmwareRamTotal" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c3980a47e3be508ba479409ed62" UNIQUE ("ip"), CONSTRAINT "REL_f83b474ec058a91f8eda9f261d" UNIQUE ("iloId"), CONSTRAINT "PK_f8b8af38bdc23b447c0a57c7937" PRIMARY KEY ("id"))',
  'CREATE TABLE "permission_server" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "roleId" uuid NOT NULL, "bitmask" integer NOT NULL DEFAULT \'0\', "serverId" uuid, CONSTRAINT "PK_ccf720167f56f51a66b3475a63b" PRIMARY KEY ("id"))',
  'CREATE TABLE "role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "canCreateServer" boolean NOT NULL DEFAULT false, "isAdmin" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))',
  'CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "password" character varying NOT NULL, "email" character varying, "isTwoFactorEnabled" boolean NOT NULL DEFAULT false, "twoFactorSecret" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastLoggedIn" TIMESTAMP, "recoveryCodes" text array, "isActive" boolean NOT NULL DEFAULT true, "isVerified" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "resetPasswordToken" character varying, "resetPasswordExpiry" TIMESTAMP, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))',
  "CREATE TYPE \"public\".\"widget_type\" AS ENUM('stats', 'activity-feed', 'alerts', 'resource-usage', 'user-presence', 'system-health', 'ups-status')",
  'CREATE TABLE "dashboard_widgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."widget_type" NOT NULL, "title" character varying(255) NOT NULL, "position" jsonb NOT NULL, "settings" jsonb, "refresh_interval" integer, "visible" boolean NOT NULL DEFAULT true, "layout_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a77038e4644617970badd975284" PRIMARY KEY ("id"))',
  'CREATE TABLE "dashboard_layouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "columns" integer NOT NULL DEFAULT \'12\', "row_height" integer NOT NULL DEFAULT \'80\', "is_default" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1850c429674a715d8cb13769efb" PRIMARY KEY ("id"))',
  'CREATE TABLE "dashboard_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "default_layout_id" uuid, "refresh_interval" integer NOT NULL DEFAULT \'30000\', "theme" character varying(20) NOT NULL DEFAULT \'light\', "notifications" jsonb NOT NULL DEFAULT \'{"alerts":true,"activities":false}\', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_280fe6e94d2968dead6828ccce3" UNIQUE ("user_id"), CONSTRAINT "REL_280fe6e94d2968dead6828ccce" UNIQUE ("user_id"), CONSTRAINT "PK_7fe68b766b0745c53bf95895d9f" PRIMARY KEY ("id"))',
  'CREATE TABLE "dashboard_templates" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text NOT NULL, "preview" character varying(500), "widgets" jsonb NOT NULL, "columns" integer NOT NULL DEFAULT \'12\', "row_height" integer NOT NULL DEFAULT \'80\', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_17a92cc2e48efc2a3c168eec6b8" UNIQUE ("name"), CONSTRAINT "PK_6c71c37f6487e2ed41a4de7212d" PRIMARY KEY ("id"))',
  'CREATE TABLE "history_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity" character varying NOT NULL, "entityId" character varying NOT NULL, "action" character varying NOT NULL, "userId" uuid, "oldValue" jsonb, "newValue" jsonb, "metadata" jsonb, "ipAddress" character varying, "userAgent" character varying, "correlationId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7fbfa45c0a68854e44cba8c6497" PRIMARY KEY ("id"))',
  "CREATE TYPE \"public\".\"setup_progress_step_enum\" AS ENUM('welcome', 'planning', 'rooms', 'ups', 'servers', 'relationships', 'review', 'complete', 'create-room', 'create-ups', 'create-server', 'vm-discovery')",
  'CREATE TABLE "setup_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "step" "public"."setup_progress_step_enum" NOT NULL, "completedAt" TIMESTAMP NOT NULL, "completedBy" character varying NOT NULL, "metadata" json, CONSTRAINT "PK_87d342514e0b5b68559ce5afee7" PRIMARY KEY ("id"))',
  'CREATE TABLE "system_settings" ("id" character varying(36) NOT NULL DEFAULT \'singleton\', "settings" jsonb NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, CONSTRAINT "PK_82521f08790d248b2a80cc85d40" PRIMARY KEY ("id"))',
  'CREATE TYPE "public"."user_preferences_locale_enum" AS ENUM(\'fr\', \'en\')',
  'CREATE TYPE "public"."user_preferences_theme_enum" AS ENUM(\'light\', \'dark\')',
  'CREATE TABLE "user_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "locale" "public"."user_preferences_locale_enum" NOT NULL DEFAULT \'fr\', "theme" "public"."user_preferences_theme_enum" NOT NULL DEFAULT \'dark\', "timezone" character varying NOT NULL DEFAULT \'UTC\', "notifications" jsonb NOT NULL DEFAULT \'{"server":true,"ups":true,"email":false,"push":true}\', "display" jsonb NOT NULL DEFAULT \'{"defaultUserView":"table","defaultServerView":"grid","defaultUpsView":"grid","defaultRoomView":"grid","defaultGroupView":"grid","compactMode":false}\', "integrations" jsonb NOT NULL DEFAULT \'{}\', "performance" jsonb NOT NULL DEFAULT \'{"autoRefresh":true,"refreshInterval":60}\', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_458057fa75b66e68a275647da2e" UNIQUE ("user_id"), CONSTRAINT "PK_e8cfb5b31af61cd363a6b6d7c25" PRIMARY KEY ("id"))',
  'CREATE TABLE "user_roles" ("userId" uuid NOT NULL, "roleId" uuid NOT NULL, CONSTRAINT "PK_88481b0c4ed9ada47e9fdd67475" PRIMARY KEY ("userId", "roleId"))',
  'CREATE INDEX "IDX_472b25323af01488f1f66a06b6" ON "user_roles" ("userId")',
  'CREATE INDEX "IDX_86033897c009fcca8b6505d6be" ON "user_roles" ("roleId")',
  'ALTER TABLE "permission_vm" ADD CONSTRAINT "FK_12fdfb375f0126cafdba33ee849" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "permission_vm" ADD CONSTRAINT "FK_bfbb61f8f1d593b59375858c276" FOREIGN KEY ("vmId") REFERENCES "vm"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
  'ALTER TABLE "vm" ADD CONSTRAINT "FK_ba05bdb9ba2dc67b899830fd83d" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "vm" ADD CONSTRAINT "FK_c22deb8aa9293793c5c12650908" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "ups" ADD CONSTRAINT "FK_05d137f99b386620e64d51f341c" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "server" ADD CONSTRAINT "FK_930179be61799a196d0704cd907" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "server" ADD CONSTRAINT "FK_e4df170ae4c236d2005844e9076" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "server" ADD CONSTRAINT "FK_be433e1eb33b226b5da737f5424" FOREIGN KEY ("upsId") REFERENCES "ups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "server" ADD CONSTRAINT "FK_f83b474ec058a91f8eda9f261d0" FOREIGN KEY ("iloId") REFERENCES "ilo"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
  'ALTER TABLE "permission_server" ADD CONSTRAINT "FK_e6e4b1fda3cf0b1fff9a15900b8" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "permission_server" ADD CONSTRAINT "FK_d8106026a47302b3af6379c25a2" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
  'ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "FK_34ec67535e1a5c78ce512d8702c" FOREIGN KEY ("layout_id") REFERENCES "dashboard_layouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
  'ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "FK_ddcbe1e4b5bca76d3a72ff21860" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "dashboard_preferences" ADD CONSTRAINT "FK_280fe6e94d2968dead6828ccce3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "history_event" ADD CONSTRAINT "FK_2f9dbf5a1d7c6c471fd45d8bc6d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "system_settings" ADD CONSTRAINT "FK_301c531938f84c39fa5019e7465" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
  'ALTER TABLE "user_roles" ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE',
  'ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
];

export class BaselineSchema1700000000000 implements MigrationInterface {
  name = 'BaselineSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ provisioned }] = await queryRunner.query(
      `SELECT to_regclass('public."user"') IS NOT NULL AS provisioned`,
    );
    if (provisioned) return;

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    for (const query of BASELINE_QUERIES) {
      await queryRunner.query(query);
    }
  }

  public async down(): Promise<void> {
    return;
  }
}
