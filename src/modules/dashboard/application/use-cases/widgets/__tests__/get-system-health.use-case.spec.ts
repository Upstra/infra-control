import { GetSystemHealthUseCase } from '../get-system-health.use-case';
import { DatabaseHealthService } from '../../../../../health/domain/services/database-health.service';
import { RedisHealthService } from '../../../../../health/domain/services/redis-health.service';

describe('GetSystemHealthUseCase', () => {
  let useCase: GetSystemHealthUseCase;
  let databaseHealthService: jest.Mocked<DatabaseHealthService>;
  let redisHealthService: jest.Mocked<RedisHealthService>;

  beforeEach(() => {
    databaseHealthService = {
      checkHealth: jest.fn(),
    } as any;

    redisHealthService = {
      checkHealth: jest.fn(),
    } as any;

    useCase = new GetSystemHealthUseCase(
      databaseHealthService,
      redisHealthService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return healthy status when all components are operational', async () => {
      const mockDbHealth = {
        isHealthy: true,
        responseTime: 25,
      };
      const mockRedisHealth = {
        isHealthy: true,
        responseTime: 5,
      };

      databaseHealthService.checkHealth.mockResolvedValue(mockDbHealth as any);
      redisHealthService.checkHealth.mockResolvedValue(mockRedisHealth as any);

      const result = await useCase.execute();

      expect(result).toMatchObject({
        status: 'healthy',
        score: 100,
        components: [
          {
            name: 'API Backend',
            status: 'operational',
            responseTime: 125,
            uptime: 99.98,
          },
          {
            name: 'Database',
            status: 'operational',
            responseTime: 25,
            uptime: 99.99,
          },
          {
            name: 'Redis Cache',
            status: 'operational',
            responseTime: 5,
            uptime: 99.95,
          },
        ],
        lastCheck: expect.any(Date),
      });

      expect(databaseHealthService.checkHealth).toHaveBeenCalledTimes(1);
      expect(redisHealthService.checkHealth).toHaveBeenCalledTimes(1);
    });

    it('should return unhealthy status when database is down', async () => {
      const mockDbHealth = {
        isHealthy: false,
        responseTime: 0,
      };
      const mockRedisHealth = {
        isHealthy: true,
        responseTime: 5,
      };

      databaseHealthService.checkHealth.mockResolvedValue(mockDbHealth as any);
      redisHealthService.checkHealth.mockResolvedValue(mockRedisHealth as any);

      const result = await useCase.execute();

      expect(result).toMatchObject({
        status: 'unhealthy',
        score: 67,
        components: expect.arrayContaining([
          expect.objectContaining({
            name: 'Database',
            status: 'down',
            responseTime: 0,
          }),
        ]),
      });
    });

    it('should return unhealthy status when Redis is down', async () => {
      const mockDbHealth = {
        isHealthy: true,
        responseTime: 25,
      };
      const mockRedisHealth = {
        isHealthy: false,
        responseTime: 0,
      };

      databaseHealthService.checkHealth.mockResolvedValue(mockDbHealth as any);
      redisHealthService.checkHealth.mockResolvedValue(mockRedisHealth as any);

      const result = await useCase.execute();

      expect(result).toMatchObject({
        status: 'unhealthy',
        score: 67,
        components: expect.arrayContaining([
          expect.objectContaining({
            name: 'Redis Cache',
            status: 'down',
            responseTime: 0,
          }),
        ]),
      });
    });

    it('should return unhealthy status when both database and Redis are down', async () => {
      const mockDbHealth = {
        isHealthy: false,
        responseTime: 0,
      };
      const mockRedisHealth = {
        isHealthy: false,
        responseTime: 0,
      };

      databaseHealthService.checkHealth.mockResolvedValue(mockDbHealth as any);
      redisHealthService.checkHealth.mockResolvedValue(mockRedisHealth as any);

      const result = await useCase.execute();

      expect(result).toMatchObject({
        status: 'unhealthy',
        score: 33,
        components: expect.arrayContaining([
          expect.objectContaining({
            name: 'Database',
            status: 'down',
          }),
          expect.objectContaining({
            name: 'Redis Cache',
            status: 'down',
          }),
        ]),
      });
    });

    it('should handle missing responseTime from health checks', async () => {
      const mockDbHealth = {
        isHealthy: true,
      };
      const mockRedisHealth = {
        isHealthy: true,
      };

      databaseHealthService.checkHealth.mockResolvedValue(mockDbHealth as any);
      redisHealthService.checkHealth.mockResolvedValue(mockRedisHealth as any);

      const result = await useCase.execute();

      expect(result.components[1].responseTime).toBe(0);
      expect(result.components[2].responseTime).toBe(0);
    });

    it('should handle health check errors gracefully', async () => {
      databaseHealthService.checkHealth.mockRejectedValue(
        new Error('DB connection failed'),
      );
      redisHealthService.checkHealth.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      await expect(useCase.execute()).rejects.toThrow();
    });

    it('should execute health checks in parallel', async () => {
      const mockDbHealth = {
        isHealthy: true,
        responseTime: 25,
      };
      const mockRedisHealth = {
        isHealthy: true,
        responseTime: 5,
      };

      let dbCheckStarted = false;
      let _redisCheckStarted = false;

      databaseHealthService.checkHealth.mockImplementation(async () => {
        dbCheckStarted = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return mockDbHealth as any;
      });

      redisHealthService.checkHealth.mockImplementation(async () => {
        _redisCheckStarted = true;
        expect(dbCheckStarted).toBe(true);
        return mockRedisHealth as any;
      });

      await useCase.execute();

      expect(databaseHealthService.checkHealth).toHaveBeenCalledTimes(1);
      expect(redisHealthService.checkHealth).toHaveBeenCalledTimes(1);
    });
  });
});
