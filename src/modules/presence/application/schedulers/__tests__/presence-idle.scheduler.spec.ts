import { PresenceIdleScheduler } from '../presence-idle.scheduler';
import { PresenceDomainService } from '../../../domain/services/presence.domain.service';

describe('PresenceIdleScheduler', () => {
  const lastActivityAt = '2026-11-05T10:00:00.000Z';
  const presence = { listOnline: jest.fn() };
  const gateway = { broadcast: jest.fn() };
  const scheduler = new PresenceIdleScheduler(
    presence as any,
    new PresenceDomainService(),
    gateway as any,
  );
  const at = (seconds: number) => Date.parse(lastActivityAt) + seconds * 1000;

  it('broadcasts once when a user turns idle', async () => {
    presence.listOnline.mockResolvedValue([
      {
        userId: 'jbidule',
        record: {
          route: '/ups',
          title: null,
          lastActivityAt,
          connectedAt: null,
        },
      },
    ]);

    await scheduler.sweep(at(30));
    expect(gateway.broadcast).not.toHaveBeenCalled();

    await expect(scheduler.sweep(at(121))).resolves.toBe(1);
    await expect(scheduler.sweep(at(150))).resolves.toBe(0);
    expect(gateway.broadcast).toHaveBeenCalledTimes(1);
  });
});
