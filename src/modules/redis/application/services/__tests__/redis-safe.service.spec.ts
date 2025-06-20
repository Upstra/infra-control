import { RedisSafeService } from '../redis-safe.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

const createRedisMock = (overrides: Partial<Redis> = {}): jest.Mocked<Redis> =>
  ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    ...overrides,
  }) as any;

describe('RedisSafeService', () => {
  let service: RedisSafeService;
  let redisService: jest.Mocked<RedisService>;
  let client: jest.Mocked<Redis>;

  beforeEach(() => {
    client = createRedisMock();
    redisService = { getOrNil: jest.fn().mockReturnValue(client) } as any;
    service = new RedisSafeService(redisService);
  });

  it('safeGet returns value when redis online', async () => {
    client.get.mockResolvedValue('val');
    const result = await service.safeGet('key');
    expect(result).toBe('val');
  });

  it('safeSet does nothing when client unavailable', async () => {
    redisService.getOrNil.mockReturnValue(null);
    await service.safeSet('k', 'v');
    expect(client.set).not.toHaveBeenCalled();
  });

  it('safeDel handles redis error gracefully', async () => {
    client.del.mockRejectedValue(new Error('oops'));
    await service.safeDel('k1');
    expect(service.isOnline()).toBe(false);
  });

  it('safeExpire calls expire when client available', async () => {
    await service.safeExpire('k1', 60);
    expect(client.expire).toHaveBeenCalledWith('k1', 60);
  });

  it('keys returns empty array when client unavailable', async () => {
    redisService.getOrNil.mockReturnValue(null);
    const result = await service.keys('pattern');
    expect(result).toEqual([]);
  });
});
