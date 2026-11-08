import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The setup wizard dialog used to store `active` / `inactive` while the rest of
 * the app reads `UP` / `DOWN`, so wizard-created servers showed as powered off
 * on the UPS page. Bring every legacy value back to the canonical pair.
 */
export class NormalizeServerState1762459200000 implements MigrationInterface {
  name = 'NormalizeServerState1762459200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "server" SET "state" = 'DOWN'
       WHERE lower("state") IN ('down', 'inactive', 'off', 'stopped', 'poweredoff')
         AND "state" <> 'DOWN'`,
    );
    await queryRunner.query(
      `UPDATE "server" SET "state" = 'UP' WHERE "state" NOT IN ('UP', 'DOWN')`,
    );
  }

  public async down(): Promise<void> {
    // Data normalization only: the legacy values carried no extra meaning.
  }
}
