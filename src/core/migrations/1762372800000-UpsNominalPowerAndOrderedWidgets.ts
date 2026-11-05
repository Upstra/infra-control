import { MigrationInterface, QueryRunner } from 'typeorm';
import { WidgetType } from '../../modules/dashboard/domain/entities/dashboard-widget.entity';
import {
  LEGACY_WIDGET_TYPES,
  migrateLayoutWidgets,
  OrderedWidgetPosition,
} from '../../modules/dashboard/domain/services/dashboard-layout-rules';

interface WidgetRow {
  id: string;
  layout_id: string;
  type: string;
  position: OrderedWidgetPosition;
}

export class UpsNominalPowerAndOrderedWidgets1762372800000
  implements MigrationInterface
{
  name = 'UpsNominalPowerAndOrderedWidgets1762372800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ups" ADD "nominalPowerW" integer`);
    await this.useVarcharType(queryRunner);

    const rows: WidgetRow[] = await queryRunner.query(
      `SELECT "id", "layout_id", "type", "position" FROM "dashboard_widgets"`,
    );
    const byLayout = new Map<string, WidgetRow[]>();
    rows.forEach((row) =>
      byLayout.set(row.layout_id, [
        ...(byLayout.get(row.layout_id) ?? []),
        row,
      ]),
    );
    for (const widgets of byLayout.values()) {
      for (const widget of migrateLayoutWidgets(widgets)) {
        await queryRunner.query(
          `UPDATE "dashboard_widgets" SET "type" = $1, "position" = $2 WHERE "id" = $3`,
          [widget.type, JSON.stringify(widget.position), widget.id],
        );
      }
    }

    await this.useEnumType(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.useVarcharType(queryRunner);
    for (const [legacy, current] of Object.entries(LEGACY_WIDGET_TYPES)) {
      await queryRunner.query(
        `UPDATE "dashboard_widgets" SET "type" = $1 WHERE "type" = $2`,
        [legacy, current],
      );
    }
    await this.useEnumType(queryRunner);
    await queryRunner.query(`ALTER TABLE "ups" DROP COLUMN "nominalPowerW"`);
  }

  private async useVarcharType(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dashboard_widgets" ALTER COLUMN "type" TYPE character varying USING "type"::text`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."widget_type"`);
  }

  private async useEnumType(queryRunner: QueryRunner): Promise<void> {
    const values = Object.values(WidgetType)
      .map((value) => `'${value}'`)
      .join(', ');
    await queryRunner.query(
      `CREATE TYPE "public"."widget_type" AS ENUM(${values})`,
    );
    await queryRunner.query(
      `ALTER TABLE "dashboard_widgets" ALTER COLUMN "type" TYPE "public"."widget_type" USING "type"::"public"."widget_type"`,
    );
  }
}
