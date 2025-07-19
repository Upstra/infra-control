import { GetSystemHealthUseCase } from '../get-system-health.use-case';
import { GetHealthStatusUseCase } from '../../../../../health/application/use-cases/get-health-status.use-case';

describe('GetSystemHealthUseCase', () => {
  let useCase: GetSystemHealthUseCase;
  let healthStatusUseCase: jest.Mocked<GetHealthStatusUseCase>;

  beforeEach(() => {
    healthStatusUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new GetSystemHealthUseCase(healthStatusUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return healthy status when all components are operational', async () => {
      const mockHealthStatus = {
        status: 'up' as const,
        timestamp: '2024-07-03T10:30:00.000Z',
        totalResponseTime: 100,
        checks: [
          {
            name: 'database',
            status: 'up' as const,
            responseTime: 25,
          },
          {
            name: 'redis',
            status: 'up' as const,
            responseTime: 5,
          },
          {
            name: 'system',
            status: 'up' as const,
            responseTime: 50,
          },
          {
            name: 'github',
            status: 'up' as const,
            responseTime: 20,
          },
        ],
        summary: {
          total: 4,
          up: 4,
          down: 0,
          unknown: 0,
        },
      };

      healthStatusUseCase.execute.mockResolvedValue(mockHealthStatus);

      const result = await useCase.execute();

      expect(result).toMatchObject({
        status: 'healthy',
        score: 100,
        components: expect.arrayContaining([
          expect.objectContaining({
            name: 'Database',
            status: 'operational',
            responseTime: 25,
          }),
          expect.objectContaining({
            name: 'Redis Cache',
            status: 'operational',
            responseTime: 5,
          }),
          expect.objectContaining({
            name: 'System Resources',
            status: 'operational',
            responseTime: 50,
          }),
          expect.objectContaining({
            name: 'GitHub API',
            status: 'operational',
            responseTime: 20,
          }),
        ]),
        lastCheck: new Date('2024-07-03T10:30:00.000Z'),
      });

      expect(healthStatusUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should return unhealthy status when database is down', async () => {
      const mockHealthStatus = {
        status: 'down' as const,
        timestamp: '2024-07-03T10:30:00.000Z',
        totalResponseTime: 100,
        checks: [
          {
            name: 'database',
            status: 'down' as const,
            message: 'Connection failed',
            responseTime: 0,
          },
          {
            name: 'redis',
            status: 'up' as const,
            responseTime: 5,
          },
        ],
        summary: {
          total: 2,
          up: 1,
          down: 1,
          unknown: 0,
        },
      };

      healthStatusUseCase.execute.mockResolvedValue(mockHealthStatus);

      const result = await useCase.execute();

      expect(result).toMatchObject({
        status: 'unhealthy',
        score: 50,
        components: expect.arrayContaining([
          expect.objectContaining({
            name: 'Database',
            status: 'down',
            responseTime: 0,
            issues: ['Connection failed'],
          }),
        ]),
      });
    });

    it('should return unhealthy status when Redis is down', async () => {
      const mockHealthStatus = {
        status: 'down' as const,
        timestamp: '2024-07-03T10:30:00.000Z',
        totalResponseTime: 100,
        checks: [
          {
            name: 'database',
            status: 'up' as const,
            responseTime: 25,
          },
          {
            name: 'redis',
            status: 'down' as const,
            message: 'Redis connection failed',
            responseTime: 0,
          },
        ],
        summary: {
          total: 2,
          up: 1,
          down: 1,
          unknown: 0,
        },
      };

      healthStatusUseCase.execute.mockResolvedValue(mockHealthStatus);

      const result = await useCase.execute();

      expect(result).toMatchObject({
        status: 'unhealthy',
        score: 50,
        components: expect.arrayContaining([
          expect.objectContaining({
            name: 'Redis Cache',
            status: 'down',
            responseTime: 0,
            issues: ['Redis connection failed'],
          }),
        ]),
      });
    });

    it('should return degraded status when service is unknown', async () => {
      const mockHealthStatus = {
        status: 'degraded' as const,
        timestamp: '2024-07-03T10:30:00.000Z',
        totalResponseTime: 100,
        checks: [
          {
            name: 'database',
            status: 'up' as const,
            responseTime: 25,
          },
          {
            name: 'github',
            status: 'unknown' as const,
            message: 'Request timeout',
          },
        ],
        summary: {
          total: 2,
          up: 1,
          down: 0,
          unknown: 1,
        },
      };

      healthStatusUseCase.execute.mockResolvedValue(mockHealthStatus);

      const result = await useCase.execute();

      expect(result).toMatchObject({
        status: 'degraded',
        score: 50,
        components: expect.arrayContaining([
          expect.objectContaining({
            name: 'Database',
            status: 'operational',
          }),
          expect.objectContaining({
            name: 'GitHub API',
            status: 'degraded',
          }),
        ]),
      });
    });

    it('should handle missing responseTime from health checks', async () => {
      const mockHealthStatus = {
        status: 'up' as const,
        timestamp: '2024-07-03T10:30:00.000Z',
        totalResponseTime: 100,
        checks: [
          {
            name: 'database',
            status: 'up' as const,
          },
          {
            name: 'redis',
            status: 'up' as const,
          },
        ],
        summary: {
          total: 2,
          up: 2,
          down: 0,
          unknown: 0,
        },
      };

      healthStatusUseCase.execute.mockResolvedValue(mockHealthStatus);

      const result = await useCase.execute();

      expect(result.components[0].responseTime).toBe(0);
      expect(result.components[1].responseTime).toBe(0);
    });

    it('should handle health check errors gracefully', async () => {
      healthStatusUseCase.execute.mockRejectedValue(
        new Error('Health check failed'),
      );

      await expect(useCase.execute()).rejects.toThrow('Health check failed');
    });

    it('should properly format service names', async () => {
      const mockHealthStatus = {
        status: 'up' as const,
        timestamp: '2024-07-03T10:30:00.000Z',
        totalResponseTime: 100,
        checks: [
          {
            name: 'database',
            status: 'up' as const,
            responseTime: 25,
          },
          {
            name: 'redis',
            status: 'up' as const,
            responseTime: 5,
          },
          {
            name: 'system',
            status: 'up' as const,
            responseTime: 10,
          },
          {
            name: 'github',
            status: 'up' as const,
            responseTime: 15,
          },
        ],
        summary: {
          total: 4,
          up: 4,
          down: 0,
          unknown: 0,
        },
      };

      healthStatusUseCase.execute.mockResolvedValue(mockHealthStatus);

      const result = await useCase.execute();

      const componentNames = result.components.map((c) => c.name);
      expect(componentNames).toContain('Database');
      expect(componentNames).toContain('Redis Cache');
      expect(componentNames).toContain('System Resources');
      expect(componentNames).toContain('GitHub API');
    });
  });
});
