import { GetEventsFeedUseCase } from '../get-events-feed.use-case';
import {
  createMockAlert,
  createMockTransition,
} from '../../../__mocks__/alert.mock';
import { AlertTransitionType } from '../../../domain/types/alert.types';
import { HistoryEvent } from '@/modules/history/domain/entities/history-event.entity';

describe('GetEventsFeedUseCase', () => {
  const transitions = { findFeed: jest.fn() };
  const history = { findFeedEvents: jest.fn() };
  const useCase = new GetEventsFeedUseCase(transitions as any, history as any);

  const historyEvent = (id: string, at: string, action = 'SHUTDOWN') =>
    Object.assign(new HistoryEvent(), {
      id,
      entity: 'server',
      entityId: 'srv-1',
      action,
      userId: 'user-1',
      user: { id: 'user-1', username: 'jbidule' },
      newValue: { name: 'srv-b2-03' },
      createdAt: new Date(at),
    });

  beforeEach(() => jest.clearAllMocks());

  it('merges alert transitions and user actions newest first', async () => {
    transitions.findFeed.mockResolvedValue([
      createMockTransition({
        id: 't-ack',
        type: AlertTransitionType.ACKNOWLEDGED,
        at: new Date('2026-11-04T20:05:00Z'),
        byUser: { id: 'user-1', username: 'jbidule' } as any,
        alert: createMockAlert(),
      }),
    ]);
    history.findFeedEvents.mockResolvedValue([
      historyEvent('h-1', '2026-11-04T20:06:00Z'),
    ]);

    const result = await useCase.execute({ limit: 10 });

    expect(result.items.map((item) => item.id)).toEqual(['h-1', 't-ack']);
    expect(result.items[0]).toMatchObject({
      kind: 'action',
      title: 'jbidule a arrêté srv-b2-03',
    });
    expect(result.items[1]).toMatchObject({
      kind: 'alert',
      tone: 'critical',
      title: 'jbidule a acquitté UPS-B2',
    });
    expect(result.nextCursor).toBeNull();
  });

  it('honours the cursor and returns the next one when the page is full', async () => {
    transitions.findFeed.mockResolvedValue([]);
    history.findFeedEvents.mockResolvedValue([
      historyEvent('h-2', '2026-11-04T19:00:00Z'),
    ]);
    const cursor = Buffer.from('2026-11-04T20:00:00.000Z|h-9').toString(
      'base64url',
    );

    const result = await useCase.execute({ limit: 1, cursor });

    expect(history.findFeedEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        before: { at: new Date('2026-11-04T20:00:00.000Z'), id: 'h-9' },
        limit: 1,
      }),
    );
    expect(transitions.findFeed).toHaveBeenCalledWith(
      expect.objectContaining({
        excludeTypes: [AlertTransitionType.DEESCALATED],
      }),
    );
    expect(result.nextCursor).not.toBeNull();
  });

  it('only asks history for machine actions, never logins', async () => {
    transitions.findFeed.mockResolvedValue([]);
    history.findFeedEvents.mockResolvedValue([]);

    await useCase.execute({});

    const { actions } = history.findFeedEvents.mock.calls[0][0];
    expect(actions).toEqual(
      expect.arrayContaining(['START', 'RESTART', 'SHUTDOWN']),
    );
    expect(actions.some((action: string) => action.startsWith('LOGIN'))).toBe(
      false,
    );
  });
});
