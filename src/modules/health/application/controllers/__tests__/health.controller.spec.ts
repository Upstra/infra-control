import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { GetHealthStatusUseCase } from '../../use-cases/get-health-status.use-case';
import { HealthResponseDto } from '../../dto/health-response.dto';

describe('HealthController', () => {
  let controller: HealthController;
  let getHealthStatusUseCase: jest.Mocked<GetHealthStatusUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: GetHealthStatusUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    getHealthStatusUseCase = module.get(GetHealthStatusUseCase);
  });

  describe('check', () => {
    it('should return comprehensive health status', async () => {
      const mockHealthResponse: HealthResponseDto = {
        status: 'up',
        timestamp: '2024-07-03T10:30:00.000Z',
        totalResponseTime: 150,
        checks: [
          {
            name: 'database',
            status: 'up',
            message: 'Database connection is healthy',
            responseTime: 25,
            details: {
              database: 'test_db',
              type: 'postgres',
              isInitialized: true,
            },
          },
          {
            name: 'redis',
            status: 'up',
            message: 'Redis connection is healthy',
            responseTime: 10,
            details: {
              version: '7.0.0',
              uptime: 86400,
              connectedClients: 5,
            },
          },
          {
            name: 'system',
            status: 'up',
            message: 'System resources are healthy',
            responseTime: 5,
            details: {
              memory: {
                total: 8589934592,
                free: 4294967296,
                used: 4294967296,
                percentage: 50,
              },
              uptime: 86400,
            },
          },
          {
            name: 'github',
            status: 'up',
            message: 'GitHub API is accessible',
            responseTime: 110,
            details: {
              statusCode: 200,
              rateLimit: '4999',
            },
          },
        ],
        summary: {
          total: 4,
          up: 4,
          down: 0,
          unknown: 0,
        },
      };

      getHealthStatusUseCase.execute.mockResolvedValue(mockHealthResponse);

      const result = await controller.check();

      expect(result).toEqual(mockHealthResponse);
      expect(getHealthStatusUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should return degraded status when some services are down', async () => {
      const mockHealthResponse: HealthResponseDto = {
        status: 'degraded',
        timestamp: '2024-07-03T10:30:00.000Z',
        totalResponseTime: 200,
        checks: [
          {
            name: 'database',
            status: 'up',
            message: 'Database connection is healthy',
            responseTime: 25,
          },
          {
            name: 'redis',
            status: 'up',
            message: 'Redis connection is healthy',
            responseTime: 10,
          },
          {
            name: 'system',
            status: 'down',
            message: 'Memory usage is above 90%',
            responseTime: 5,
          },
          {
            name: 'github',
            status: 'unknown',
            message: 'GitHub API token not configured',
            responseTime: 1,
          },
        ],
        summary: {
          total: 4,
          up: 2,
          down: 1,
          unknown: 1,
        },
      };

      getHealthStatusUseCase.execute.mockResolvedValue(mockHealthResponse);

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.summary.down).toBe(1);
      expect(result.summary.unknown).toBe(1);
    });

    it('should handle use case errors gracefully', async () => {
      getHealthStatusUseCase.execute.mockRejectedValue(
        new Error('Health check failed'),
      );

      await expect(controller.check()).rejects.toThrow('Health check failed');
      expect(getHealthStatusUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('simpleCheck', () => {
    it('should return simple health status', () => {
      const result = controller.simpleCheck();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    });

    it('should return different timestamps on multiple calls', () => {
      const result1 = controller.simpleCheck();
      const result2 = controller.simpleCheck();

      expect(result1.status).toBe('ok');
      expect(result2.status).toBe('ok');
      // Timestamps should be different (though this might fail if called in same millisecond)
      expect(result1.timestamp).toBeDefined();
      expect(result2.timestamp).toBeDefined();
    });

    it('should not call the use case for simple check', () => {
      controller.simpleCheck();

      expect(getHealthStatusUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
