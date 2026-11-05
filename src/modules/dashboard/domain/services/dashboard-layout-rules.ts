import { WidgetType } from '../entities/dashboard-widget.entity';

export const ALLOWED_WIDGET_WIDTHS = [4, 6, 8, 12] as const;

export const LEGACY_WIDGET_TYPES: Record<string, WidgetType> = {
  [WidgetType.STATS]: WidgetType.KPIS,
  [WidgetType.ACTIVITY_FEED]: WidgetType.EVENTS,
  [WidgetType.USER_PRESENCE]: WidgetType.PRESENCE,
  [WidgetType.UPS_STATUS]: WidgetType.UPS,
};

export const DEFAULT_LAYOUT_WIDGETS: Array<{
  type: WidgetType;
  title: string;
  w: number;
}> = [
  { type: WidgetType.INCIDENT, title: 'Incident en cours', w: 12 },
  { type: WidgetType.KPIS, title: 'Indicateurs', w: 12 },
  { type: WidgetType.UPS, title: 'Onduleurs', w: 8 },
  { type: WidgetType.HOSTS, title: 'Hôtes ESXi', w: 4 },
  { type: WidgetType.VMS, title: 'Machines virtuelles', w: 8 },
  { type: WidgetType.EVENTS, title: "Fil d'événements", w: 4 },
];

export interface OrderedWidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function nearestAllowedWidth(width: number): number {
  return ALLOWED_WIDGET_WIDTHS.reduce((best, candidate) =>
    Math.abs(candidate - width) < Math.abs(best - width) ? candidate : best,
  );
}

export function isValidOrderedPosition(
  position: OrderedWidgetPosition,
): boolean {
  return (
    Number.isInteger(position.x) &&
    position.x >= 0 &&
    (ALLOWED_WIDGET_WIDTHS as readonly number[]).includes(position.w)
  );
}

export function migrateLayoutWidgets<
  T extends { type: string; position: OrderedWidgetPosition },
>(widgets: T[]): T[] {
  return [...widgets]
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
    .map((widget, rank) => ({
      ...widget,
      type: LEGACY_WIDGET_TYPES[widget.type] ?? widget.type,
      position: {
        x: rank,
        y: 0,
        w: nearestAllowedWidth(widget.position.w),
        h: 1,
      },
    }));
}
