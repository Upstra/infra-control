import { AlertService } from '../alert.service';
import { Alert } from '../../entities/alert.entity';
import { AlertEvents } from '../../events/alert.events';
import {
  AlertResourceType,
  AlertSeverity,
  AlertStatus,
  AlertTransitionType,
} from '../../types/alert.types';
import { RaiseAlertInput } from '../../interfaces/raise-alert.interface';

describe('AlertService', () => {
  let store: Alert[];
  const alertRepository = {
    findOpenByDedupKey: jest.fn(
      async (key: string) =>
        store.find(
          (a) => a.dedupKey === key && a.status === AlertStatus.OPEN,
        ) ?? null,
    ),
    findById: jest.fn(
      async (id: string) => store.find((a) => a.id === id) ?? null,
    ),
    save: jest.fn(async (alert: Alert) => {
      if (!alert.id) {
        alert.id = `alert-${store.length + 1}`;
        store.push(alert);
      }
      return alert;
    }),
  };
  const transitionRepository = {
    save: jest.fn(async (t) => ({ ...t, id: 't' })),
  };
  const eventEmitter = { emit: jest.fn() };
  const logHistory = { executeStructured: jest.fn() };
  const service = new AlertService(
    alertRepository as any,
    transitionRepository as any,
    eventEmitter as any,
    logHistory as any,
  );

  const input = (severity = AlertSeverity.WARNING): RaiseAlertInput => ({
    dedupKey: 'ups:ups-1:low_battery',
    type: 'ups_low_battery',
    severity,
    resource: { type: AlertResourceType.UPS, id: 'ups-1', name: 'UPS-B2' },
    title: 'UPS-B2 : batterie faible',
    message: 'Autonomie restante : 4 min',
    details: { minutesRemaining: 4 },
  });

  const transitionTypes = () =>
    transitionRepository.save.mock.calls.map(([t]) => t.type);

  beforeEach(() => {
    store = [];
    jest.clearAllMocks();
  });

  it('keeps a single alert when the same dedupKey is raised twice', async () => {
    await service.raise(input());
    const alert = await service.raise(input());

    expect(store).toHaveLength(1);
    expect(alert.occurrences).toBe(2);
    expect(transitionTypes()).toEqual([AlertTransitionType.OPENED]);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AlertEvents.TRANSITION,
      expect.objectContaining({ alert }),
    );
  });

  it('drops the acknowledgement when an acknowledged alert gets worse', async () => {
    const opened = await service.raise(input(AlertSeverity.WARNING));
    await service.acknowledge(opened.id, 'user-1');

    const escalated = await service.raise(input(AlertSeverity.CRITICAL));

    expect(escalated.acknowledgedAt).toBeNull();
    expect(transitionTypes()).toEqual([
      AlertTransitionType.OPENED,
      AlertTransitionType.ACKNOWLEDGED,
      AlertTransitionType.ESCALATED,
      AlertTransitionType.UNACKNOWLEDGED,
    ]);
    expect(logHistory.executeStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'alert',
        action: 'ACKNOWLEDGE',
        userId: 'user-1',
      }),
    );
  });

  it('does nothing when resolving without an open alert', async () => {
    await expect(service.resolve('ups:ups-1:on_battery')).resolves.toBeNull();

    expect(alertRepository.save).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
