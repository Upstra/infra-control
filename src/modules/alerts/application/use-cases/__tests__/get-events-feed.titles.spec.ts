import { GetEventsFeedUseCase } from '../get-events-feed.use-case';
import {
  createMockAlert,
  createMockTransition,
} from '../../../__mocks__/alert.mock';
import {
  AlertSeverity,
  AlertTransitionType,
} from '../../../domain/types/alert.types';
import { HistoryEvent } from '@/modules/history/domain/entities/history-event.entity';

describe('GetEventsFeedUseCase titles', () => {
  const transitions = { findFeed: jest.fn() };
  const history = { findFeedEvents: jest.fn().mockResolvedValue([]) };
  const useCase = new GetEventsFeedUseCase(transitions as any, history as any);
  const at = (minute: number) =>
    new Date(`2026-11-04T20:${String(minute).padStart(2, '0')}:00Z`);

  it('words every alert transition for the feed', async () => {
    const alert = createMockAlert();
    transitions.findFeed.mockResolvedValue([
      createMockTransition({
        id: 't1',
        type: AlertTransitionType.ESCALATED,
        toSeverity: AlertSeverity.CRITICAL,
        at: at(5),
        alert,
      }),
      createMockTransition({
        id: 't2',
        type: AlertTransitionType.UNACKNOWLEDGED,
        at: at(4),
        alert,
      }),
      createMockTransition({
        id: 't3',
        type: AlertTransitionType.UNACKNOWLEDGED,
        at: at(3),
        alert,
        byUser: { id: 'u', username: 'zoe' } as any,
      }),
      createMockTransition({
        id: 't4',
        type: AlertTransitionType.RESOLVED,
        at: at(2),
        alert,
      }),
      createMockTransition({
        id: 't5',
        type: AlertTransitionType.ACKNOWLEDGED,
        at: at(1),
        alert,
        byUser: null,
      }),
    ]);

    const { items } = await useCase.execute({ limit: 10 });

    expect(items.map((item) => item.title)).toEqual([
      'UPS-B2 est sur batterie — aggravée (critical)',
      'Acquittement retiré, alerte aggravée : UPS-B2 est sur batterie',
      "zoe a retiré l'acquittement de UPS-B2",
      'Résolue : UPS-B2 est sur batterie',
      'Un utilisateur a acquitté UPS-B2',
    ]);
  });

  it('words user actions, falls back on the entity and system actor', async () => {
    transitions.findFeed.mockResolvedValue([]);
    history.findFeedEvents.mockResolvedValue([
      Object.assign(new HistoryEvent(), {
        id: 'h1',
        entity: 'vm',
        entityId: 'vm-1',
        action: 'RESTART',
        userId: null,
        metadata: { vmName: 'db-pg-02' },
        createdAt: at(9),
      }),
      Object.assign(new HistoryEvent(), {
        id: 'h2',
        entity: 'ups',
        entityId: 'ups-1',
        action: 'UPDATE',
        userId: 'u',
        user: { username: 'zoe' },
        createdAt: at(8),
      }),
      Object.assign(new HistoryEvent(), {
        id: 'h3',
        entity: 'server',
        entityId: 's-1',
        action: 'REBOOT_BIOS',
        userId: 'u',
        user: { username: 'zoe' },
        oldValue: { name: 'srv-1' },
        createdAt: at(8),
      }),
    ]);

    const { items } = await useCase.execute({
      from: '2026-11-04T00:00:00Z',
      to: '2026-11-05T00:00:00Z',
    });

    expect(items.map((item) => item.title)).toEqual([
      'Système a redémarré db-pg-02',
      'zoe reboot_bios srv-1',
      'zoe a modifié ups',
    ]);
    expect(items[0].by).toBeNull();
  });

  it('rejects a corrupted cursor', async () => {
    await expect(
      useCase.execute({ cursor: Buffer.from('nope').toString('base64url') }),
    ).rejects.toThrow('Invalid cursor');
  });
});
