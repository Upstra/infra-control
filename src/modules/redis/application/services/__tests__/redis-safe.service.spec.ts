import { RedisSafeService } from '../redis-safe.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

const createRedisMock = (overrides: Partial<Redis> = {}): jest.Mocked<Redis> =>
  ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    setex: jest.fn(),
    mget: jest.fn(),
    lrange: jest.fn(),
    hget: jest.fn(),
    lpush: jest.fn(),
    keys: jest.fn(),
    ...overrides,
  }) as any;

describe('RedisSafeService', () => {
  let service: RedisSafeService;
  let redisService: jest.Mocked<RedisService>;
  let client: jest.Mocked<Redis>;
  let loggerSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let clearIntervalSpy: jest.SpyInstance;
  let setIntervalSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    client = createRedisMock();
    redisService = { getOrNil: jest.fn().mockReturnValue(client) } as any;
    
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    setIntervalSpy = jest.spyOn(global, 'setInterval');
    
    service = new RedisSafeService(redisService);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    loggerSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    setIntervalSpy.mockRestore();
  });

  describe('initialization', () => {
    it('should connect successfully when Redis is available', () => {
      expect(loggerSpy).toHaveBeenCalledWith('Redis connecté');
      expect(service.isOnline()).toBe(true);
    });

    it('should handle offline Redis on initialization', () => {
      redisService.getOrNil.mockReturnValue(null);
      service = new RedisSafeService(redisService);
      
      expect(loggerErrorSpy).toHaveBeenCalledWith('Redis offline, tentative de reconnexion…');
      expect(service.isOnline()).toBe(false);
      expect(setIntervalSpy).toHaveBeenCalled();
    });

    it('should schedule reconnect when Redis is offline', () => {
      redisService.getOrNil.mockReturnValue(null);
      service = new RedisSafeService(redisService);
      
      const initialCalls = redisService.getOrNil.mock.calls.length;
      jest.advanceTimersByTime(30000);
      expect(redisService.getOrNil).toHaveBeenCalledTimes(initialCalls + 1);
    });

    it('should clear reconnect interval when connection is restored', () => {
      redisService.getOrNil.mockReturnValueOnce(null);
      service = new RedisSafeService(redisService);
      
      redisService.getOrNil.mockReturnValue(client);
      jest.advanceTimersByTime(30000);
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(service.isOnline()).toBe(true);
    });
  });

  describe('safeGet', () => {
    it('should return value when redis is online', async () => {
      client.get.mockResolvedValue('value');
      const result = await service.safeGet('key');
      expect(result).toBe('value');
      expect(client.get).toHaveBeenCalledWith('key');
    });

    it('should return null when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      const result = await service.safeGet('key');
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.get.mockRejectedValue(error);
      
      const result = await service.safeGet('key');
      
      expect(result).toBeNull();
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('safeMGet', () => {
    it('should return values when redis is online', async () => {
      client.mget.mockResolvedValue(['val1', 'val2']);
      const result = await service.safeMGet(['key1', 'key2']);
      expect(result).toEqual(['val1', 'val2']);
      expect(client.mget).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should return empty array when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      const result = await service.safeMGet(['key1', 'key2']);
      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.mget.mockRejectedValue(error);
      
      const result = await service.safeMGet(['key1', 'key2']);
      
      expect(result).toEqual([]);
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('safeSet', () => {
    it('should set value when redis is online', async () => {
      await service.safeSet('key', 'value');
      expect(client.set).toHaveBeenCalledWith('key', 'value');
    });

    it('should do nothing when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      await service.safeSet('key', 'value');
      expect(client.set).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.set.mockRejectedValue(error);
      
      await service.safeSet('key', 'value');
      
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('safeDel', () => {
    it('should delete key when redis is online', async () => {
      await service.safeDel('key');
      expect(client.del).toHaveBeenCalledWith('key');
    });

    it('should do nothing when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      await service.safeDel('key');
      expect(client.del).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.del.mockRejectedValue(error);
      
      await service.safeDel('key');
      
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('safeExpire', () => {
    it('should set expiration when redis is online', async () => {
      await service.safeExpire('key', 60);
      expect(client.expire).toHaveBeenCalledWith('key', 60);
    });

    it('should do nothing when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      await service.safeExpire('key', 60);
      expect(client.expire).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.expire.mockRejectedValue(error);
      
      await service.safeExpire('key', 60);
      
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('safeSetEx', () => {
    it('should set value with expiration when redis is online', async () => {
      await service.safeSetEx('key', 60, 'value');
      expect(client.setex).toHaveBeenCalledWith('key', 60, 'value');
    });

    it('should do nothing when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      await service.safeSetEx('key', 60, 'value');
      expect(client.setex).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.setex.mockRejectedValue(error);
      
      await service.safeSetEx('key', 60, 'value');
      
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('keys', () => {
    it('should return keys when redis is online', async () => {
      client.keys.mockResolvedValue(['key1', 'key2']);
      const result = await service.keys('pattern:*');
      expect(result).toEqual(['key1', 'key2']);
      expect(client.keys).toHaveBeenCalledWith('pattern:*');
    });

    it('should return empty array when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      const result = await service.keys('pattern:*');
      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.keys.mockRejectedValue(error);
      
      const result = await service.keys('pattern:*');
      
      expect(result).toEqual([]);
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('safeLRange', () => {
    it('should return list range when redis is online', async () => {
      client.lrange.mockResolvedValue(['item1', 'item2']);
      const result = await service.safeLRange('list', 0, -1);
      expect(result).toEqual(['item1', 'item2']);
      expect(client.lrange).toHaveBeenCalledWith('list', 0, -1);
    });

    it('should return empty array when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      const result = await service.safeLRange('list', 0, -1);
      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.lrange.mockRejectedValue(error);
      
      const result = await service.safeLRange('list', 0, -1);
      
      expect(result).toEqual([]);
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('safeHGet', () => {
    it('should return hash field value when redis is online', async () => {
      client.hget.mockResolvedValue('fieldValue');
      const result = await service.safeHGet('hash', 'field');
      expect(result).toBe('fieldValue');
      expect(client.hget).toHaveBeenCalledWith('hash', 'field');
    });

    it('should return null when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      const result = await service.safeHGet('hash', 'field');
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.hget.mockRejectedValue(error);
      
      const result = await service.safeHGet('hash', 'field');
      
      expect(result).toBeNull();
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('safeLPush', () => {
    it('should push value to list when redis is online', async () => {
      await service.safeLPush('list', 'value');
      expect(client.lpush).toHaveBeenCalledWith('list', 'value');
    });

    it('should do nothing when client is unavailable', async () => {
      redisService.getOrNil.mockReturnValue(null);
      await service.safeLPush('list', 'value');
      expect(client.lpush).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      client.lpush.mockRejectedValue(error);
      
      await service.safeLPush('list', 'value');
      
      expect(service.isOnline()).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Erreur Redis: Redis error');
    });
  });

  describe('reconnection logic', () => {
    it('should not schedule multiple reconnect intervals', () => {
      redisService.getOrNil.mockReturnValue(null);
      service = new RedisSafeService(redisService);
      
      const error = new Error('Redis error');
      client.get = jest.fn().mockRejectedValue(error);
      redisService.getOrNil.mockReturnValue(client);
      
      service.safeGet('key1');
      service.safeGet('key2');
      
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });
  });
});