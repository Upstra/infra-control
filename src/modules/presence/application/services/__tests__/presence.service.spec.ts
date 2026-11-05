import { PresenceService } from '../presence.service';

describe('PresenceService', () => {
  let store: Record<string, string>;
  const redis = {
    safeGet: jest.fn(async (key: string) => store[key] ?? null),
    safeSetEx: jest.fn(async (key: string, _ttl: number, value: string) => {
      store[key] = value;
    }),
    safeDel: jest.fn(),
    keys: jest.fn(async () => Object.keys(store)),
    safeMGet: jest.fn(async (keys: string[]) =>
      keys.map((key) => store[key] ?? null),
    ),
  };
  const service = new PresenceService(redis as any);

  beforeEach(() => {
    store = {};
    jest.clearAllMocks();
  });

  it('keeps the last route when a ping has none, and does not count passive pings as activity', async () => {
    await service.recordActivity('u1', { route: '/vms', title: 'VMs' });
    const first = JSON.parse(store['presence:u1']);

    await service.recordActivity('u1', { active: false });

    const second = JSON.parse(store['presence:u1']);
    expect(second.route).toBe('/vms');
    expect(second.lastActivityAt).toBe(first.lastActivityAt);
  });

  it('still understands the legacy "online" value', async () => {
    store['presence:u2'] = 'online';

    await expect(service.isOnline('u2')).resolves.toBe(true);
    await expect(service.getRecord('u2')).resolves.toEqual({
      route: null,
      title: null,
      lastActivityAt: null,
      connectedAt: null,
    });
  });

  it('lists online users and counts them from the presence keys', async () => {
    await service.markOnline('u1');
    await service.markOnline('u2');

    const online = await service.listOnline();

    expect(online.map((entry) => entry.userId).sort()).toEqual(['u1', 'u2']);
    await expect(service.getConnectedUserCount()).resolves.toBe(2);
  });
});
