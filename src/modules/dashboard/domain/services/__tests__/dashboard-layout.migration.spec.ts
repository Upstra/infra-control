import {
  migrateLayoutWidgets,
  nearestAllowedWidth,
} from '../dashboard-layout-rules';

describe('dashboard layout migration', () => {
  const widget = (
    id: string,
    type: string,
    x: number,
    y: number,
    w: number,
  ) => ({
    id,
    type,
    position: { x, y, w, h: 3 },
  });

  it('turns widgets sorted by (y, x) into ranks 0..n on a single row', () => {
    const migrated = migrateLayoutWidgets([
      widget('c', 'alerts', 0, 6, 12),
      widget('b', 'system-health', 6, 0, 6),
      widget('a', 'alerts', 0, 0, 6),
    ]);

    expect(migrated.map((item) => [item.id, item.position.x])).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
    expect(
      migrated.every((item) => item.position.y === 0 && item.position.h === 1),
    ).toBe(true);
  });

  it('rounds widths to the nearest allowed value, the smaller one on a tie', () => {
    expect([1, 5, 7, 9, 10, 11, 12, 16].map(nearestAllowedWidth)).toEqual([
      4, 4, 6, 8, 8, 12, 12, 12,
    ]);
  });

  it('converts the legacy widget types and keeps the others', () => {
    const migrated = migrateLayoutWidgets([
      widget('1', 'stats', 0, 0, 12),
      widget('2', 'activity-feed', 0, 1, 4),
      widget('3', 'user-presence', 0, 2, 4),
      widget('4', 'ups-status', 0, 3, 8),
      widget('5', 'alerts', 0, 4, 4),
      widget('6', 'system-health', 0, 5, 4),
    ]);

    expect(migrated.map((item) => item.type)).toEqual([
      'kpis',
      'events',
      'presence',
      'ups',
      'alerts',
      'system-health',
    ]);
  });
});
