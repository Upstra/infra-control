import { Alert } from '../domain/entities/alert.entity';
import { AlertTransition } from '../domain/entities/alert-transition.entity';
import {
  AlertResourceType,
  AlertSeverity,
  AlertStatus,
  AlertTransitionType,
} from '../domain/types/alert.types';

export const createMockAlert = (overrides: Partial<Alert> = {}): Alert =>
  Object.assign(new Alert(), {
    id: 'alert-1',
    dedupKey: 'ups:ups-1:on_battery',
    type: 'ups_on_battery',
    severity: AlertSeverity.CRITICAL,
    status: AlertStatus.OPEN,
    resourceType: AlertResourceType.UPS,
    resourceId: 'ups-1',
    resourceName: 'UPS-B2',
    title: 'UPS-B2 est sur batterie',
    message: 'Coupure secteur',
    details: null,
    openedAt: new Date('2026-11-04T20:00:00.000Z'),
    lastSeenAt: new Date('2026-11-04T20:00:00.000Z'),
    resolvedAt: null,
    acknowledgedAt: null,
    acknowledgedById: null,
    occurrences: 1,
    ...overrides,
  });

export const createMockTransition = (
  overrides: Partial<AlertTransition> = {},
): AlertTransition =>
  Object.assign(new AlertTransition(), {
    id: 'transition-1',
    alertId: 'alert-1',
    type: AlertTransitionType.OPENED,
    at: new Date('2026-11-04T20:00:00.000Z'),
    byUserId: null,
    fromSeverity: null,
    toSeverity: AlertSeverity.CRITICAL,
    alert: createMockAlert(),
    ...overrides,
  });
