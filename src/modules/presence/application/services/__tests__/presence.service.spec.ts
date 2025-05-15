import { PresenceService } from '../presence.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

describe('PresenceService', () => {
  let service: PresenceService;
  let redisService: jest.Mocked<RedisService>;
  let redisClient: jest.Mocked<Redis>;

  beforeEach(() => {
    redisClient = {
      set: jest.fn(),
      del: jest.fn(),
      get: jest.fn(),
      expire: jest.fn(),
    } as any;

    redisService = {
      getOrThrow: jest.fn().mockReturnValue(redisClient),
    } as any;

    service = new PresenceService(redisService);
  });

  it('should mark user as online', async () => {
    await service.markOnline('user-123');
    expect(redisClient.set).toHaveBeenCalledWith('presence:user-123', 'online');
  });

  it('should mark user as offline', async () => {
    await service.markOffline('user-123');
    expect(redisClient.del).toHaveBeenCalledWith('presence:user-123');
  });

  it('should check if user is online', async () => {
    redisClient.get.mockResolvedValueOnce('online');
    const result = await service.isOnline('user-123');
    expect(redisClient.get).toHaveBeenCalledWith('presence:user-123');
    expect(result).toBe(true);
  });

  it('should return false if user is not online', async () => {
    redisClient.get.mockResolvedValueOnce(null);
    const result = await service.isOnline('user-123');
    expect(result).toBe(false);
  });

  it('should refresh TTL for user', async () => {
    await service.refreshTTL('user-123');
    expect(redisClient.expire).toHaveBeenCalledWith('presence:user-123', 60);
  });
});
