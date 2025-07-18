import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { UpsBatteryCacheService } from '../ups-battery-cache.service';
import { UPSBatteryStatusDto } from '../../../domain/interfaces/ups-battery-status.interface';
import { UpsBatteryEvents } from '../../../domain/events/ups-battery.events';

describe('UpsBatteryCacheService', () => {
  let service: UpsBatteryCacheService;
  let cacheManager: Cache;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
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
    timestamp: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsBatteryCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UpsBatteryCacheService>(UpsBatteryCacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should retrieve cached battery status', async () => {
      mockCacheManager.get.mockResolvedValue(mockBatteryStatus);

      const result = await service.get('ups-123');

      expect(result).toEqual(mockBatteryStatus);
      expect(mockCacheManager.get).toHaveBeenCalledWith('ups:battery:ups-123');
    });

    it('should return null if no cached data exists', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get('ups-123');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should cache battery status with TTL', async () => {
      await service.set('ups-123', mockBatteryStatus);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'ups:battery:ups-123',
        mockBatteryStatus,
        300000,
      );
    });
  });

  describe('delete', () => {
    it('should delete cached battery status', async () => {
      await service.delete('ups-123');

      expect(mockCacheManager.del).toHaveBeenCalledWith('ups:battery:ups-123');
    });
  });

  describe('getMultiple', () => {
    it('should retrieve multiple cached battery statuses', async () => {
      const mockStatus2: UPSBatteryStatusDto = {
        ...mockBatteryStatus,
        upsId: 'ups-456',
      };

      mockCacheManager.get
        .mockResolvedValueOnce(mockBatteryStatus)
        .mockResolvedValueOnce(mockStatus2)
        .mockResolvedValueOnce(null);

      const result = await service.getMultiple(['ups-123', 'ups-456', 'ups-789']);

      expect(result).toEqual({
        'ups-123': mockBatteryStatus,
        'ups-456': mockStatus2,
        'ups-789': null,
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

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'ups:battery:ups-123',
        mockBatteryStatus,
        300000,
      );
    });
  });

  describe('event handlers', () => {
    it('should cache battery status on BATTERY_CHECKED event', async () => {
      await service.handleBatteryChecked(mockBatteryStatus);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'ups:battery:ups-123',
        mockBatteryStatus,
        300000,
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

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
    });
  });
});