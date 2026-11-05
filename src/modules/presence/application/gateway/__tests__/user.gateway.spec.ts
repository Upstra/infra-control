import {
  PRESENCE_FULL_ROOM,
  PRESENCE_LIMITED_ROOM,
  UserGateway,
} from '../user.gateway';
import { PresenceDomainService } from '../../../domain/services/presence.domain.service';
import { PresenceService } from '../../services/presence.service';

describe('UserGateway (presence)', () => {
  let store: Record<string, string>;
  const redis = {
    safeGet: jest.fn(async (key: string) => store[key] ?? null),
    safeSetEx: jest.fn(async (key: string, _ttl: number, value: string) => {
      store[key] = value;
    }),
    safeDel: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
  const jwt = { verify: jest.fn() };
  const rooms: Record<string, jest.Mock> = {
    [PRESENCE_FULL_ROOM]: jest.fn(),
    [PRESENCE_LIMITED_ROOM]: jest.fn(),
  };
  const domain = new PresenceDomainService();
  const gateway = new UserGateway(
    new PresenceService(redis as any),
    jwt as any,
    domain,
  );
  const client = (token: string) =>
    ({
      handshake: { auth: { token } },
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    }) as any;
  const lastUpdate = (room: string) => rooms[room].mock.calls.at(-1)?.[1];

  beforeEach(() => {
    store = {};
    jest.clearAllMocks();
    gateway.server = { to: (room: string) => ({ emit: rooms[room] }) } as any;
    jwt.verify.mockImplementation((token: string) =>
      token === 'inactive'
        ? { userId: 'zoe', isActive: false }
        : { userId: 'jbidule', isActive: true },
    );
  });

  it('stores the route and title sent with user:ping', async () => {
    await gateway.handlePing(client('jbidule'), {
      route: '/ups',
      title: 'Onduleurs',
    });

    expect(JSON.parse(store['presence:jbidule'])).toMatchObject({
      route: '/ups',
      title: 'Onduleurs',
    });
    expect(redis.safeSetEx).toHaveBeenCalledWith(
      'presence:jbidule',
      60,
      expect.any(String),
    );
    expect(lastUpdate(PRESENCE_FULL_ROOM)).toMatchObject({
      userId: 'jbidule',
      online: true,
      status: 'active',
      route: '/ups',
    });
  });

  it('reports idle after two minutes without activity', async () => {
    await gateway.handlePing(client('jbidule'), { route: '/vms' });
    const record = JSON.parse(store['presence:jbidule']);

    const later = new Date(record.lastActivityAt).getTime() + 2 * 60 * 1000 + 1;

    expect(domain.toView('jbidule', record, true, later).status).toBe('idle');
    expect(domain.toView('jbidule', record, true, later - 2000).status).toBe(
      'active',
    );
  });

  it('hides the route from viewers who may not see other users', async () => {
    const viewer = client('inactive');
    await gateway.handleConnection(viewer);
    await gateway.handlePing(client('jbidule'), {
      route: '/admin/users',
      title: 'Utilisateurs',
    });

    expect(viewer.join).toHaveBeenCalledWith(PRESENCE_LIMITED_ROOM);
    expect(lastUpdate(PRESENCE_LIMITED_ROOM)).toEqual({
      userId: 'jbidule',
      online: true,
      status: 'active',
      route: null,
      title: null,
      lastActivityAt: null,
    });
  });
});
