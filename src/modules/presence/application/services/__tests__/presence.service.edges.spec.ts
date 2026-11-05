import { PresenceService } from '../presence.service';

describe('PresenceService edge cases', () => {
  const redis = {
    safeGet: jest.fn(),
    safeSetEx: jest.fn(),
    safeDel: jest.fn(),
    safeExpire: jest.fn(),
    keys: jest.fn(),
    safeMGet: jest.fn(),
  };
  const service = new PresenceService(redis as any);

  beforeEach(() => jest.clearAllMocks());

  it('keeps the previous page and connection time when the user reconnects', async () => {
    redis.safeGet.mockResolvedValue(
      JSON.stringify({
        route: '/vms',
        title: 'VMs',
        lastActivityAt: 'a',
        connectedAt: 'c',
      }),
    );

    const record = await service.markOnline('u1');

    expect(record).toMatchObject({
      route: '/vms',
      title: 'VMs',
      connectedAt: 'c',
    });
  });

  it('skips corrupted or expired entries in the online list and handles an empty store', async () => {
    redis.keys
      .mockResolvedValueOnce(['presence:a', 'presence:b', 'presence:c'])
      .mockResolvedValueOnce([]);
    redis.safeMGet.mockResolvedValue([
      JSON.stringify({
        route: null,
        title: null,
        lastActivityAt: null,
        connectedAt: null,
      }),
      '{bad',
      null,
    ]);

    expect((await service.listOnline()).map((entry) => entry.userId)).toEqual([
      'a',
    ]);
    expect(await service.listOnline()).toEqual([]);
  });

  it('refreshes the TTL, marks offline and tracks several users', async () => {
    redis.safeMGet.mockResolvedValue(['online', null]);

    await service.refreshTTL('u1');
    await service.markOffline('u1');

    expect(redis.safeExpire).toHaveBeenCalledWith('presence:u1', 60);
    expect(redis.safeDel).toHaveBeenCalledWith('presence:u1');
    expect(await service.trackUsers(['u1', 'u2'])).toEqual([true, false]);
  });
});
