import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UpsBatteryCacheService } from '../ups-battery-cache.service';
import { UPSBatteryStatusDto } from '../../../domain/interfaces/ups-battery-status.interface';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';

describe('UpsBatteryCacheService', () => {
  let service: UpsBatteryCacheService;

  const mockRedisSafeService = {
    safeGet: jest.fn(),
    safeSetEx: jest.fn(),
    safeDel: jest.fn(),
    safeMGet: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'UPS_BATTERY_CACHE_TTL_SECONDS') return 300;
      return defaultValue;
    }),
  };

  const mockBatteryStatus: UPSBatteryStatusDto = {
    upsId: 'ups-123',
    ip: '192.168.1.100',
    minutesRemaining: 45,
    hoursRemaining: 0.75,
    alertLevel: 'normal',
    statusLabel: 'Normal',
    timestamp: new Date('2025-07-18T23:35:34.417Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsBatteryCacheService,
        {
          provide: RedisSafeService,
          useValue: mockRedisSafeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UpsBatteryCacheService>(UpsBatteryCacheService);

    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should retrieve cached battery status', async () => {
      mockRedisSafeService.safeGet.mockResolvedValue(
        JSON.stringify(mockBatteryStatus),
      );

      const result = await service.get('ups-123');

      expect(result).toEqual({
        ...mockBatteryStatus,
        timestamp: mockBatteryStatus.timestamp.toISOString(),
      });
      expect(mockRedisSafeService.safeGet).toHaveBeenCalledWith(
        'ups:battery:ups-123',
      );
    });

    it('should return null if no cached data exists', async () => {
      mockRedisSafeService.safeGet.mockResolvedValue(null);

      const result = await service.get('ups-123');

      expect(result).toBeNull();
    });

    it('should return null if JSON parsing fails', async () => {
      mockRedisSafeService.safeGet.mockResolvedValue('invalid-json');

      const result = await service.get('ups-123');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should cache battery status with TTL', async () => {
      await service.set('ups-123', mockBatteryStatus);

      expect(mockRedisSafeService.safeSetEx).toHaveBeenCalledWith(
        'ups:battery:ups-123',
        300,
        JSON.stringify(mockBatteryStatus),
      );
    });
  });

  describe('delete', () => {
    it('should delete cached battery status', async () => {
      await service.delete('ups-123');

      expect(mockRedisSafeService.safeDel).toHaveBeenCalledWith(
        'ups:battery:ups-123',
      );
    });
  });

  describe('getMultiple', () => {
    it('should retrieve multiple cached battery statuses', async () => {
      const mockStatus2: UPSBatteryStatusDto = {
        ...mockBatteryStatus,
        upsId: 'ups-456',
      };

      mockRedisSafeService.safeMGet.mockResolvedValue([
        JSON.stringify(mockBatteryStatus),
        JSON.stringify(mockStatus2),
        null,
      ]);

      const result = await service.getMultiple([
        'ups-123',
        'ups-456',
        'ups-789',
      ]);

      expect(result).toEqual({
        'ups-123': {
          ...mockBatteryStatus,
          timestamp: mockBatteryStatus.timestamp.toISOString(),
        },
        'ups-456': {
          ...mockStatus2,
          timestamp: mockStatus2.timestamp.toISOString(),
        },
        'ups-789': null,
      });
      expect(mockRedisSafeService.safeMGet).toHaveBeenCalledWith([
        'ups:battery:ups-123',
        'ups:battery:ups-456',
        'ups:battery:ups-789',
      ]);
    });

    it('should return empty object for empty array', async () => {
      const result = await service.getMultiple([]);

      expect(result).toEqual({});
      expect(mockRedisSafeService.safeMGet).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in results', async () => {
      mockRedisSafeService.safeMGet.mockResolvedValue([
        'invalid-json',
        JSON.stringify(mockBatteryStatus),
      ]);

      const result = await service.getMultiple(['ups-123', 'ups-456']);

      expect(result).toEqual({
        'ups-123': null,
        'ups-456': {
          ...mockBatteryStatus,
          timestamp: mockBatteryStatus.timestamp.toISOString(),
        },
      });
    });
  });

  describe('setMultiple', () => {
    it('should cache multiple battery statuses', async () => {
      const statuses = {
        'ups-123': mockBatteryStatus,
        'ups-456': { ...mockBatteryStatus, upsId: 'ups-456' },
      };

      await service.setMultiple(statuses);

      expect(mockRedisSafeService.safeSetEx).toHaveBeenCalledTimes(2);
      expect(mockRedisSafeService.safeSetEx).toHaveBeenCalledWith(
        'ups:battery:ups-123',
        300,
        JSON.stringify(mockBatteryStatus),
      );
    });
  });

  describe('event handlers', () => {
    it('should cache battery status on BATTERY_CHECKED event', async () => {
      await service.handleBatteryChecked(mockBatteryStatus);

      expect(mockRedisSafeService.safeSetEx).toHaveBeenCalledWith(
        'ups:battery:ups-123',
        300,
        JSON.stringify(mockBatteryStatus),
      );
    });

    it('should cache multiple statuses on BATCH_CHECKED event', async () => {
      const payload = {
        results: [
          mockBatteryStatus,
          { ...mockBatteryStatus, upsId: 'ups-456' },
        ],
      };

      await service.handleBatchChecked(payload);

      expect(mockRedisSafeService.safeSetEx).toHaveBeenCalledTimes(2);
    });
  });
});
