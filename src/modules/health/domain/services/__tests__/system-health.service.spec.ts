import { Test, TestingModule } from '@nestjs/testing';
import { SystemHealthService } from '../system-health.service';
import * as os from 'os';

// Mock os module
jest.mock('os', () => ({
  totalmem: jest.fn(),
  freemem: jest.fn(),
  uptime: jest.fn(),
  platform: jest.fn(),
  arch: jest.fn(),
}));

const mockOs = os as jest.Mocked<typeof os>;

describe('SystemHealthService', () => {
  let service: SystemHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemHealthService],
    }).compile();

    service = module.get<SystemHealthService>(SystemHealthService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should return healthy status when system resources are normal', async () => {
      // Mock system info with healthy memory usage (50%)
      mockOs.totalmem.mockReturnValue(8589934592); // 8GB
      mockOs.freemem.mockReturnValue(4294967296); // 4GB (50% free)
      mockOs.uptime.mockReturnValue(86400); // 1 day
      mockOs.platform.mockReturnValue('linux');
      mockOs.arch.mockReturnValue('x64');

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'system',
        status: 'up',
        message: 'System resources are healthy',
        responseTime: expect.any(Number),
        details: {
          memory: {
            total: 8589934592,
            free: 4294967296,
            used: 4294967296,
            percentage: 50,
          },
          uptime: 86400,
          platform: 'linux',
          arch: 'x64',
          nodeVersion: process.version,
          pid: process.pid,
        },
      });
    });

    it('should return down status when memory usage is above threshold', async () => {
      // Mock system info with high memory usage (95%)
      mockOs.totalmem.mockReturnValue(8589934592); // 8GB
      mockOs.freemem.mockReturnValue(429496729); // 0.4GB (95% used)
      mockOs.uptime.mockReturnValue(86400);
      mockOs.platform.mockReturnValue('linux');
      mockOs.arch.mockReturnValue('x64');

      const result = await service.checkHealth();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Memory usage is above 90%');
      expect(result.details.memory.percentage).toBe(95);
    });

    it('should handle system info errors gracefully', async () => {
      mockOs.totalmem.mockImplementation(() => {
        throw new Error('System info unavailable');
      });

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'system',
        status: 'down',
        message: 'System health check failed: System info unavailable',
        responseTime: expect.any(Number),
        details: {
          error: 'System info unavailable',
        },
      });
    });

    it('should calculate memory percentage correctly', async () => {
      mockOs.totalmem.mockReturnValue(1000000000); // 1GB
      mockOs.freemem.mockReturnValue(250000000); // 250MB (75% used)
      mockOs.uptime.mockReturnValue(3600);
      mockOs.platform.mockReturnValue('darwin');
      mockOs.arch.mockReturnValue('arm64');

      const result = await service.checkHealth();

      expect(result.details.memory).toEqual({
        total: 1000000000,
        free: 250000000,
        used: 750000000,
        percentage: 75,
      });
    });

    it('should handle zero memory scenarios', async () => {
      mockOs.totalmem.mockReturnValue(0);
      mockOs.freemem.mockReturnValue(0);
      mockOs.uptime.mockReturnValue(0);
      mockOs.platform.mockReturnValue('win32');
      mockOs.arch.mockReturnValue('x64');

      const result = await service.checkHealth();

      expect(result.details.memory.percentage).toBe(NaN);
      expect(result.status).toBe('down'); // NaN should be treated as unhealthy
    });

    it('should include process information in details', async () => {
      mockOs.totalmem.mockReturnValue(8589934592);
      mockOs.freemem.mockReturnValue(4294967296);
      mockOs.uptime.mockReturnValue(86400);
      mockOs.platform.mockReturnValue('linux');
      mockOs.arch.mockReturnValue('x64');

      const result = await service.checkHealth();

      expect(result.details).toMatchObject({
        platform: 'linux',
        arch: 'x64',
        nodeVersion: process.version,
        pid: process.pid,
      });
    });

    it('should measure response time accurately', async () => {
      mockOs.totalmem.mockReturnValue(8589934592);
      mockOs.freemem.mockReturnValue(4294967296);
      mockOs.uptime.mockImplementation(() => {
        // Simulate some delay
        for (let i = 0; i < 1000000; i++) {
          /* busy wait */
        }
        return 86400;
      });
      mockOs.platform.mockReturnValue('linux');
      mockOs.arch.mockReturnValue('x64');

      const result = await service.checkHealth();

      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.responseTime).toBeLessThan(1000);
    });

    it('should handle different memory usage scenarios at boundary', async () => {
      // Test exactly at 90% threshold
      mockOs.totalmem.mockReturnValue(10000000000); // 10GB
      mockOs.freemem.mockReturnValue(1000000000); // 1GB (90% used)
      mockOs.uptime.mockReturnValue(86400);
      mockOs.platform.mockReturnValue('linux');
      mockOs.arch.mockReturnValue('x64');

      const result = await service.checkHealth();

      expect(result.status).toBe('down'); // Should be unhealthy at exactly 90% (not less than 90%)
      expect(result.details.memory.percentage).toBe(90);
    });

    it('should handle very low memory scenarios', async () => {
      mockOs.totalmem.mockReturnValue(1000000); // 1MB
      mockOs.freemem.mockReturnValue(950000); // 0.95MB (5% used)
      mockOs.uptime.mockReturnValue(86400);
      mockOs.platform.mockReturnValue('linux');
      mockOs.arch.mockReturnValue('x64');

      const result = await service.checkHealth();

      expect(result.status).toBe('up');
      expect(result.details.memory.percentage).toBe(5);
    });
  });
});
