import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveGracePeriodFromServerToUps1752616110000
  implements MigrationInterface
{
  name = 'MoveGracePeriodFromServerToUps1752616110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ups" ADD "grace_period_on" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "ups" ADD "grace_period_off" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "ups" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ups" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );

    await queryRunner.query(
      `ALTER TABLE "server" DROP COLUMN "grace_period_on"`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" DROP COLUMN "grace_period_off"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "server" ADD "grace_period_on" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "server" ADD "grace_period_off" integer NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(`ALTER TABLE "ups" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "ups" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "ups" DROP COLUMN "grace_period_off"`);
    await queryRunner.query(`ALTER TABLE "ups" DROP COLUMN "grace_period_on"`);
  }
}
