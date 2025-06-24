import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { PresenceService } from '../presence.service';

describe('PresenceService', () => {
  let service: PresenceService;
  let redisSafeService: jest.Mocked<RedisSafeService>;

  beforeEach(() => {
    redisSafeService = {
      safeSet: jest.fn(),
      safeDel: jest.fn(),
      safeGet: jest.fn(),
      safeExpire: jest.fn(),
    } as any;

    service = new PresenceService(redisSafeService);
  });

  it('should mark user as online', async () => {
    await service.markOnline('user-123');
    expect(redisSafeService.safeSet).toHaveBeenCalledWith(
      'presence:user-123',
      'online',
    );
  });

  it('should mark user as offline', async () => {
    await service.markOffline('user-123');
    expect(redisSafeService.safeDel).toHaveBeenCalledWith('presence:user-123');
  });

  it('should check if user is online', async () => {
    redisSafeService.safeGet.mockResolvedValueOnce('online');
    const result = await service.isOnline('user-123');
    expect(redisSafeService.safeGet).toHaveBeenCalledWith('presence:user-123');
    expect(result).toBe(true);
  });

  it('should return false if user is not online', async () => {
    redisSafeService.safeGet.mockResolvedValueOnce(null);
    const result = await service.isOnline('user-123');
    expect(result).toBe(false);
  });

  it('should refresh TTL for user', async () => {
    await service.refreshTTL('user-123');
    expect(redisSafeService.safeExpire).toHaveBeenCalledWith(
      'presence:user-123',
      60,
    );
  });

  it('should count connected users', async () => {
    redisSafeService.keys = jest
      .fn()
      .mockResolvedValue(['presence:u1', 'presence:u2']);
    const count = await service.getConnectedUserCount();
    expect(redisSafeService.keys).toHaveBeenCalledWith('presence:*');
    expect(count).toBe(2);
  });
});
