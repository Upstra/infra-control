import { QueryFailedError } from 'typeorm';
import { AlertService } from '../alert.service';
import {
  AlertNotFoundException,
  AlertAlreadyResolvedException,
} from '../../exceptions/alert.exceptions';
import {
  AlertResourceType,
  AlertSeverity,
  AlertStatus,
  AlertTransitionType,
} from '../../types/alert.types';
import { createMockAlert } from '../../../__mocks__/alert.mock';

describe('AlertService edge cases', () => {
  const repository = {
    findOpenByDedupKey: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(async (alert) => alert),
  };
  const transitions = { save: jest.fn(async (transition) => transition) };
  const history = { executeStructured: jest.fn() };
  const service = new AlertService(
    repository as any,
    transitions as any,
    { emit: jest.fn() } as any,
    history as any,
  );
  const input = {
    dedupKey: 'k',
    type: 'ups_overload',
    severity: AlertSeverity.INFO,
    resource: { type: AlertResourceType.UPS, id: 'u', name: 'UPS-B2' },
    title: 't',
    message: 'm',
    details: { load: 120 },
  };
  const types = () =>
    transitions.save.mock.calls.map(([transition]) => transition.type);

  beforeEach(() => jest.clearAllMocks());

  it('confirms the concurrent alert when another process opened it first', async () => {
    const concurrent = createMockAlert({
      severity: AlertSeverity.INFO,
      occurrences: 1,
    });
    repository.findOpenByDedupKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrent);
    repository.save.mockRejectedValueOnce(
      new QueryFailedError('INSERT', [], { code: '23505' } as any),
    );

    const alert = await service.raise(input);

    expect(alert.occurrences).toBe(2);
    expect(types()).toEqual([]);
  });

  it('de-escalates, resolves with the latest details and removes an acknowledgement', async () => {
    const alert = createMockAlert({
      severity: AlertSeverity.CRITICAL,
      details: { atOpen: { load: 130 }, latest: { load: 130 } },
    });
    repository.findOpenByDedupKey.mockResolvedValue(alert);
    await service.raise({ ...input, severity: AlertSeverity.WARNING });
    await service.resolve('k', { load: 80 });

    const acknowledged = createMockAlert({
      acknowledgedAt: new Date(),
      acknowledgedById: 'u1',
    });
    repository.findById.mockResolvedValue(acknowledged);
    await service.unacknowledge(acknowledged.id, 'u1');

    expect(alert.status).toBe(AlertStatus.RESOLVED);
    expect(alert.details).toEqual({
      atOpen: { load: 130 },
      latest: { load: 80 },
    });
    expect(types()).toEqual([
      AlertTransitionType.DEESCALATED,
      AlertTransitionType.RESOLVED,
      AlertTransitionType.UNACKNOWLEDGED,
    ]);
    expect(history.executeStructured).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'UNACKNOWLEDGE' }),
    );
  });

  it('refuses unknown or resolved alerts and ignores a no-op acknowledgement change', async () => {
    repository.findById.mockResolvedValueOnce(null);
    await expect(service.acknowledge('x', 'u')).rejects.toBeInstanceOf(
      AlertNotFoundException,
    );

    repository.findById.mockResolvedValueOnce(
      createMockAlert({ status: AlertStatus.RESOLVED }),
    );
    await expect(service.unacknowledge('x', 'u')).rejects.toBeInstanceOf(
      AlertAlreadyResolvedException,
    );

    repository.findById.mockResolvedValueOnce(
      createMockAlert({ acknowledgedAt: new Date() }),
    );
    await service.acknowledge('x', 'u');
    repository.findById.mockResolvedValueOnce(createMockAlert());
    await service.unacknowledge('x', 'u');
    expect(transitions.save).not.toHaveBeenCalled();
  });
});
