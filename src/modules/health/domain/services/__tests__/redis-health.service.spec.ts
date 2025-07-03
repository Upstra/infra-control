import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { RedisHealthService } from '../redis-health.service';
import { Redis } from 'ioredis';

describe('RedisHealthService', () => {
  let service: RedisHealthService;
  let mockRedis: jest.Mocked<Redis>;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    mockRedis = {
      ping: jest.fn(),
      info: jest.fn(),
    } as any;

    mockRedisService = {
      getOrNil: jest.fn().mockReturnValue(mockRedis),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RedisHealthService>(RedisHealthService);
  });

  describe('checkHealth', () => {
    it('should return healthy status when Redis is working', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      mockRedis.info.mockImplementation((section) => {
        if (section === 'server') {
          return Promise.resolve(
            'redis_version:7.0.0\r\nuptime_in_seconds:86400\r\nconnected_clients:10\r\n',
          );
        }
        if (section === 'memory') {
          return Promise.resolve(
            'used_memory_human:1.5M\r\nmaxmemory_human:0B\r\n',
          );
        }
        return Promise.resolve('');
      });

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'redis',
        status: 'up',
        message: 'Redis connection is healthy',
        responseTime: expect.any(Number),
        details: {
          version: '7.0.0',
          uptime: 86400,
          connectedClients: 10,
          usedMemory: '1.5M',
          maxMemory: '0B',
        },
      });
      expect(mockRedis.ping).toHaveBeenCalled();
      expect(mockRedis.info).toHaveBeenCalledWith('server');
      expect(mockRedis.info).toHaveBeenCalledWith('memory');
    });

    it('should return down status when Redis client is not available', async () => {
      mockRedisService.getOrNil.mockReturnValue(null);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'redis',
        status: 'down',
        message: 'Redis client not available',
        responseTime: expect.any(Number),
      });
    });

    it('should return down status when ping fails', async () => {
      mockRedis.ping.mockResolvedValue('UNEXPECTED');

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'redis',
        status: 'down',
        message: 'Redis ping failed',
        responseTime: expect.any(Number),
      });
    });

    it('should handle Redis connection errors gracefully', async () => {
      const error = new Error('Connection refused');
      mockRedis.ping.mockRejectedValue(error);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'redis',
        status: 'down',
        message: 'Redis error: Connection refused',
        responseTime: expect.any(Number),
        details: {
          error: 'Connection refused',
        },
      });
    });

    it('should handle info command failure gracefully', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      mockRedis.info.mockRejectedValue(new Error('Info failed'));

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'redis',
        status: 'down',
        message: 'Redis error: Info failed',
        responseTime: expect.any(Number),
        details: {
          error: 'Info failed',
        },
      });
    });

    it('should parse Redis info correctly with maxmemory set', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      mockRedis.info.mockImplementation((section) => {
        if (section === 'server') {
          return Promise.resolve(
            'redis_version:6.2.7\r\nuptime_in_seconds:3600\r\nconnected_clients:5\r\n',
          );
        }
        if (section === 'memory') {
          return Promise.resolve(
            'used_memory_human:2.1M\r\nmaxmemory_human:256M\r\n',
          );
        }
        return Promise.resolve('');
      });

      const result = await service.checkHealth();

      expect(result.details).toEqual({
        version: '6.2.7',
        uptime: 3600,
        connectedClients: 5,
        usedMemory: '2.1M',
        maxMemory: '256M',
      });
    });

    it('should handle empty Redis info response', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      mockRedis.info.mockResolvedValue('');

      const result = await service.checkHealth();

      expect(result.status).toBe('up');
      expect(result.details).toEqual({
        version: undefined,
        uptime: NaN,
        connectedClients: NaN,
        usedMemory: undefined,
        maxMemory: 'unlimited',
      });
    });

    it('should measure response time accurately', async () => {
      mockRedis.ping.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('PONG'), 30)),
      );
      mockRedis.info.mockResolvedValue('redis_version:7.0.0\r\n');

      const result = await service.checkHealth();

      expect(result.responseTime).toBeGreaterThan(25);
      expect(result.responseTime).toBeLessThan(100);
    });
  });

  describe('parseRedisInfo', () => {
    it('should parse Redis info format correctly', () => {
      const infoString =
        'key1:value1\r\nkey2:value2\r\n# Comment line\r\nkey3:value3\r\n';
      const result = service['parseRedisInfo'](infoString);

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });
    });

    it('should handle empty info string', () => {
      const result = service['parseRedisInfo']('');
      expect(result).toEqual({});
    });

    it('should handle malformed info lines', () => {
      const infoString = 'valid:line\r\ninvalid-line\r\nanother:valid:line\r\n';
      const result = service['parseRedisInfo'](infoString);

      expect(result).toEqual({
        valid: 'line',
        another: 'valid', // Takes first split
      });
    });
  });
});
