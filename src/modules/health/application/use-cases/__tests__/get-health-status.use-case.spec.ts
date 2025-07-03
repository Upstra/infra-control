import { Test, TestingModule } from '@nestjs/testing';
import { GetHealthStatusUseCase } from '../get-health-status.use-case';
import { DatabaseHealthService } from '../../../domain/services/database-health.service';
import { RedisHealthService } from '../../../domain/services/redis-health.service';
import { SystemHealthService } from '../../../domain/services/system-health.service';
import { GitHubHealthService } from '../../../domain/services/github-health.service';
import { HealthCheckResult } from '../../../domain/interfaces/health-check.interface';

describe('GetHealthStatusUseCase', () => {
  let useCase: GetHealthStatusUseCase;
  let databaseHealthService: jest.Mocked<DatabaseHealthService>;
  let redisHealthService: jest.Mocked<RedisHealthService>;
  let systemHealthService: jest.Mocked<SystemHealthService>;
  let githubHealthService: jest.Mocked<GitHubHealthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetHealthStatusUseCase,
        {
          provide: DatabaseHealthService,
          useValue: {
            checkHealth: jest.fn(),
          },
        },
        {
          provide: RedisHealthService,
          useValue: {
            checkHealth: jest.fn(),
          },
        },
        {
          provide: SystemHealthService,
          useValue: {
            checkHealth: jest.fn(),
          },
        },
        {
          provide: GitHubHealthService,
          useValue: {
            checkHealth: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetHealthStatusUseCase>(GetHealthStatusUseCase);
    databaseHealthService = module.get(DatabaseHealthService);
    redisHealthService = module.get(RedisHealthService);
    systemHealthService = module.get(SystemHealthService);
    githubHealthService = module.get(GitHubHealthService);
  });

  describe('execute', () => {
    it('should return overall up status when all services are healthy', async () => {
      const mockResults: HealthCheckResult[] = [
        {
          name: 'database',
          status: 'up',
          message: 'Healthy',
          responseTime: 10,
        },
        {
          name: 'redis',
          status: 'up',
          message: 'Healthy',
          responseTime: 5,
        },
        {
          name: 'system',
          status: 'up',
          message: 'Healthy',
          responseTime: 2,
        },
        {
          name: 'github',
          status: 'up',
          message: 'Healthy',
          responseTime: 100,
        },
      ];

      databaseHealthService.checkHealth.mockResolvedValue(mockResults[0]);
      redisHealthService.checkHealth.mockResolvedValue(mockResults[1]);
      systemHealthService.checkHealth.mockResolvedValue(mockResults[2]);
      githubHealthService.checkHealth.mockResolvedValue(mockResults[3]);

      const result = await useCase.execute();

      expect(result).toEqual({
        status: 'up',
        timestamp: expect.any(String),
        totalResponseTime: expect.any(Number),
        checks: mockResults,
        summary: {
          total: 4,
          up: 4,
          down: 0,
          unknown: 0,
        },
      });
    });

    it('should return down status when critical service is down', async () => {
      const mockResults: HealthCheckResult[] = [
        {
          name: 'database',
          status: 'down',
          message: 'Connection failed',
          responseTime: 5000,
        },
        {
          name: 'redis',
          status: 'up',
          message: 'Healthy',
          responseTime: 5,
        },
        {
          name: 'system',
          status: 'up',
          message: 'Healthy',
          responseTime: 2,
        },
        {
          name: 'github',
          status: 'up',
          message: 'Healthy',
          responseTime: 100,
        },
      ];

      databaseHealthService.checkHealth.mockResolvedValue(mockResults[0]);
      redisHealthService.checkHealth.mockResolvedValue(mockResults[1]);
      systemHealthService.checkHealth.mockResolvedValue(mockResults[2]);
      githubHealthService.checkHealth.mockResolvedValue(mockResults[3]);

      const result = await useCase.execute();

      expect(result.status).toBe('down');
      expect(result.summary).toEqual({
        total: 4,
        up: 3,
        down: 1,
        unknown: 0,
      });
    });

    it('should return degraded status when non-critical service is down', async () => {
      const mockResults: HealthCheckResult[] = [
        {
          name: 'database',
          status: 'up',
          message: 'Healthy',
          responseTime: 10,
        },
        {
          name: 'redis',
          status: 'up',
          message: 'Healthy',
          responseTime: 5,
        },
        {
          name: 'system',
          status: 'down',
          message: 'High memory usage',
          responseTime: 2,
        },
        {
          name: 'github',
          status: 'up',
          message: 'Healthy',
          responseTime: 100,
        },
      ];

      databaseHealthService.checkHealth.mockResolvedValue(mockResults[0]);
      redisHealthService.checkHealth.mockResolvedValue(mockResults[1]);
      systemHealthService.checkHealth.mockResolvedValue(mockResults[2]);
      githubHealthService.checkHealth.mockResolvedValue(mockResults[3]);

      const result = await useCase.execute();

      expect(result.status).toBe('degraded');
      expect(result.summary).toEqual({
        total: 4,
        up: 3,
        down: 1,
        unknown: 0,
      });
    });

    it('should return degraded status when service status is unknown', async () => {
      const mockResults: HealthCheckResult[] = [
        {
          name: 'database',
          status: 'up',
          message: 'Healthy',
          responseTime: 10,
        },
        {
          name: 'redis',
          status: 'up',
          message: 'Healthy',
          responseTime: 5,
        },
        {
          name: 'system',
          status: 'up',
          message: 'Healthy',
          responseTime: 2,
        },
        {
          name: 'github',
          status: 'unknown',
          message: 'Token not configured',
          responseTime: 1,
        },
      ];

      databaseHealthService.checkHealth.mockResolvedValue(mockResults[0]);
      redisHealthService.checkHealth.mockResolvedValue(mockResults[1]);
      systemHealthService.checkHealth.mockResolvedValue(mockResults[2]);
      githubHealthService.checkHealth.mockResolvedValue(mockResults[3]);

      const result = await useCase.execute();

      expect(result.status).toBe('degraded');
      expect(result.summary).toEqual({
        total: 4,
        up: 3,
        down: 0,
        unknown: 1,
      });
    });

    it('should handle service failures gracefully', async () => {
      databaseHealthService.checkHealth.mockRejectedValue(
        new Error('Service crashed'),
      );
      redisHealthService.checkHealth.mockResolvedValue({
        name: 'redis',
        status: 'up',
        message: 'Healthy',
        responseTime: 5,
      });
      systemHealthService.checkHealth.mockResolvedValue({
        name: 'system',
        status: 'up',
        message: 'Healthy',
        responseTime: 2,
      });
      githubHealthService.checkHealth.mockResolvedValue({
        name: 'github',
        status: 'up',
        message: 'Healthy',
        responseTime: 100,
      });

      const result = await useCase.execute();

      expect(result.status).toBe('down');
      expect(result.checks).toHaveLength(4);
      expect(result.checks[0]).toEqual({
        name: 'database',
        status: 'down',
        message: 'Health check failed: Service crashed',
        responseTime: 0,
      });
      expect(result.summary).toEqual({
        total: 4,
        up: 3,
        down: 1,
        unknown: 0,
      });
    });

    it('should handle multiple service failures', async () => {
      databaseHealthService.checkHealth.mockRejectedValue(
        new Error('DB crashed'),
      );
      redisHealthService.checkHealth.mockRejectedValue(
        new Error('Redis crashed'),
      );
      systemHealthService.checkHealth.mockResolvedValue({
        name: 'system',
        status: 'up',
        message: 'Healthy',
        responseTime: 2,
      });
      githubHealthService.checkHealth.mockResolvedValue({
        name: 'github',
        status: 'up',
        message: 'Healthy',
        responseTime: 100,
      });

      const result = await useCase.execute();

      expect(result.status).toBe('down');
      expect(result.checks[0]).toEqual({
        name: 'database',
        status: 'down',
        message: 'Health check failed: DB crashed',
        responseTime: 0,
      });
      expect(result.checks[1]).toEqual({
        name: 'redis',
        status: 'down',
        message: 'Health check failed: Redis crashed',
        responseTime: 0,
      });
      expect(result.summary).toEqual({
        total: 4,
        up: 2,
        down: 2,
        unknown: 0,
      });
    });

    it('should return valid timestamp in ISO format', async () => {
      databaseHealthService.checkHealth.mockResolvedValue({
        name: 'database',
        status: 'up',
        message: 'Healthy',
        responseTime: 10,
      });
      redisHealthService.checkHealth.mockResolvedValue({
        name: 'redis',
        status: 'up',
        message: 'Healthy',
        responseTime: 5,
      });
      systemHealthService.checkHealth.mockResolvedValue({
        name: 'system',
        status: 'up',
        message: 'Healthy',
        responseTime: 2,
      });
      githubHealthService.checkHealth.mockResolvedValue({
        name: 'github',
        status: 'up',
        message: 'Healthy',
        responseTime: 100,
      });

      const result = await useCase.execute();

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should measure total response time correctly', async () => {
      databaseHealthService.checkHealth.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  name: 'database',
                  status: 'up',
                  message: 'Healthy',
                  responseTime: 10,
                }),
              50,
            ),
          ),
      );
      redisHealthService.checkHealth.mockResolvedValue({
        name: 'redis',
        status: 'up',
        message: 'Healthy',
        responseTime: 5,
      });
      systemHealthService.checkHealth.mockResolvedValue({
        name: 'system',
        status: 'up',
        message: 'Healthy',
        responseTime: 2,
      });
      githubHealthService.checkHealth.mockResolvedValue({
        name: 'github',
        status: 'up',
        message: 'Healthy',
        responseTime: 100,
      });

      const result = await useCase.execute();

      expect(result.totalResponseTime).toBeGreaterThan(45);
      expect(result.totalResponseTime).toBeLessThan(200);
    });

    it('should handle rejected promises without error message', async () => {
      databaseHealthService.checkHealth.mockRejectedValue('String error');
      redisHealthService.checkHealth.mockResolvedValue({
        name: 'redis',
        status: 'up',
        message: 'Healthy',
        responseTime: 5,
      });
      systemHealthService.checkHealth.mockResolvedValue({
        name: 'system',
        status: 'up',
        message: 'Healthy',
        responseTime: 2,
      });
      githubHealthService.checkHealth.mockResolvedValue({
        name: 'github',
        status: 'up',
        message: 'Healthy',
        responseTime: 100,
      });

      const result = await useCase.execute();

      expect(result.checks[0]).toEqual({
        name: 'database',
        status: 'down',
        message: 'Health check failed: Unknown error',
        responseTime: 0,
      });
    });
  });
});
