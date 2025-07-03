import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DatabaseHealthService } from '../database-health.service';
import { DataSource } from 'typeorm';

describe('DatabaseHealthService', () => {
  let service: DatabaseHealthService;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      isInitialized: true,
      query: jest.fn(),
      options: {
        database: 'test_db',
        type: 'postgres' as any,
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseHealthService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DatabaseHealthService>(DatabaseHealthService);
  });

  describe('checkHealth', () => {
    it('should return healthy status when database connection is working', async () => {
      mockDataSource.query.mockResolvedValue([{ health_check: 1 }]);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'database',
        status: 'up',
        message: 'Database connection is healthy',
        responseTime: expect.any(Number),
        details: {
          database: 'test_db',
          type: 'postgres',
          isInitialized: true,
        },
      });
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'SELECT 1 as health_check',
      );
    });

    it('should return down status when database is not initialized', async () => {
      Object.defineProperty(mockDataSource, 'isInitialized', {
        value: false,
        writable: true,
      });

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'database',
        status: 'down',
        message: 'Database connection not initialized',
        responseTime: expect.any(Number),
      });
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('should return down status when health check query fails', async () => {
      mockDataSource.query.mockResolvedValue([]);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'database',
        status: 'down',
        message: 'Database health check query failed',
        responseTime: expect.any(Number),
      });
    });

    it('should return down status when health check query returns wrong result', async () => {
      mockDataSource.query.mockResolvedValue([{ health_check: 0 }]);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'database',
        status: 'down',
        message: 'Database health check query failed',
        responseTime: expect.any(Number),
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Connection failed');
      mockDataSource.query.mockRejectedValue(error);

      const result = await service.checkHealth();

      expect(result).toEqual({
        name: 'database',
        status: 'down',
        message: 'Database error: Connection failed',
        responseTime: expect.any(Number),
        details: {
          error: 'Connection failed',
          isInitialized: true,
        },
      });
    });

    it('should handle case when dataSource is null', async () => {
      const serviceWithNullDataSource = new DatabaseHealthService(null as any);

      const result = await serviceWithNullDataSource.checkHealth();

      expect(result).toEqual({
        name: 'database',
        status: 'down',
        message: expect.stringContaining('Database error:'),
        responseTime: expect.any(Number),
        details: {
          error: expect.any(String),
          isInitialized: false,
        },
      });
    });

    it('should measure response time accurately', async () => {
      mockDataSource.query.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ health_check: 1 }]), 50),
          ),
      );

      const result = await service.checkHealth();

      expect(result.responseTime).toBeGreaterThan(40);
      expect(result.responseTime).toBeLessThan(100);
    });
  });
});
