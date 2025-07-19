import { Test, TestingModule } from '@nestjs/testing';
import { GetUpsStatusUseCase } from '../get-ups-status.use-case';
import { UpsRepositoryInterface } from '../../../../../ups/domain/interfaces/ups.repository.interface';
import { UpsBatteryCacheService } from '../../../../../ups/application/services/ups-battery-cache.service';

describe('GetUpsStatusUseCase', () => {
  let useCase: GetUpsStatusUseCase;
  let upsRepository: jest.Mocked<UpsRepositoryInterface>;
  let upsBatteryCacheService: jest.Mocked<UpsBatteryCacheService>;

  const mockUpsList = [
    {
      id: 'ups-1',
      name: 'Main UPS',
      location: 'Server Room',
      model: 'APC Smart-UPS',
    },
    {
      id: 'ups-2',
      name: 'Backup UPS',
      location: 'Network Room',
      model: 'Eaton 5P',
    },
  ];

  beforeEach(async () => {
    const mockUpsRepository = {
      findAll: jest.fn(),
    };

    const mockUpsBatteryCacheService = {
      getMultiple: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUpsStatusUseCase,
        {
          provide: 'UpsRepositoryInterface',
          useValue: mockUpsRepository,
        },
        {
          provide: UpsBatteryCacheService,
          useValue: mockUpsBatteryCacheService,
        },
      ],
    }).compile();

    useCase = module.get<GetUpsStatusUseCase>(GetUpsStatusUseCase);
    upsRepository = module.get('UpsRepositoryInterface');
    upsBatteryCacheService = module.get(UpsBatteryCacheService);
  });

  describe('execute', () => {
    it('should return UPS status with correct structure', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);
      upsBatteryCacheService.getMultiple.mockResolvedValue({});

      const result = await useCase.execute();

      expect(result).toHaveProperty('ups');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.ups)).toBe(true);
      expect(result.ups).toHaveLength(2);
    });

    it('should map UPS data with cached battery status', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': {
          upsId: 'ups-1',
          ip: '192.168.1.100',
          minutesRemaining: 45,
          hoursRemaining: 0.75,
          alertLevel: 'normal',
          statusLabel: 'Normal',
          timestamp: new Date(),
        },
        'ups-2': {
          upsId: 'ups-2',
          ip: '192.168.1.101',
          minutesRemaining: 3,
          hoursRemaining: 0.05,
          alertLevel: 'critical',
          statusLabel: 'Critical',
          timestamp: new Date(),
        },
      });

      const result = await useCase.execute();

      expect(result.ups[0]).toEqual({
        id: 'ups-1',
        name: 'Main UPS',
        status: 'online',
        batteryLevel: 38,
        load: null,
        runtime: 45,
        temperature: null,
        lastTest: null,
        nextTest: null,
        isMocked: false,
      });

      expect(result.ups[1]).toEqual({
        id: 'ups-2',
        name: 'Backup UPS',
        status: 'onBattery',
        batteryLevel: 3,
        load: null,
        runtime: 3,
        temperature: null,
        lastTest: null,
        nextTest: null,
        isMocked: false,
      });
    });

    it('should handle UPS without cached data', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': null,
        'ups-2': null,
      });

      const result = await useCase.execute();

      expect(result.ups[0]).toEqual({
        id: 'ups-1',
        name: 'Main UPS',
        status: 'unavailable',
        batteryLevel: null,
        load: null,
        runtime: null,
        temperature: null,
        lastTest: null,
        nextTest: null,
        isMocked: false,
      });
    });

    it('should generate correct summary with mixed statuses', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': {
          upsId: 'ups-1',
          ip: '192.168.1.100',
          minutesRemaining: 60,
          hoursRemaining: 1,
          alertLevel: 'normal',
          statusLabel: 'Normal',
          timestamp: new Date(),
        },
        'ups-2': null,
      });

      const result = await useCase.execute();

      expect(result.summary).toEqual({
        total: 2,
        online: 1,
        onBattery: 0,
        offline: 0,
        unavailable: 1,
        averageLoad: null,
        isMocked: false,
      });
    });

    it('should handle empty UPS list', async () => {
      upsRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.ups).toEqual([]);
      expect(result.summary).toEqual({
        total: 0,
        online: 0,
        onBattery: 0,
        offline: 0,
        unavailable: 0,
        averageLoad: null,
        isMocked: false,
      });
    });

    it('should handle single UPS', async () => {
      const singleUps = [mockUpsList[0]];
      upsRepository.findAll.mockResolvedValue(singleUps as any);
      upsBatteryCacheService.getMultiple.mockResolvedValue({});

      const result = await useCase.execute();

      expect(result.ups).toHaveLength(1);
      expect(result.summary.total).toBe(1);
      expect(result.summary.unavailable).toBe(1);
    });

    it('should call repository and cache service methods', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);
      upsBatteryCacheService.getMultiple.mockResolvedValue({});

      await useCase.execute();

      expect(upsRepository.findAll).toHaveBeenCalledTimes(1);
      expect(upsRepository.findAll).toHaveBeenCalledWith();
      expect(upsBatteryCacheService.getMultiple).toHaveBeenCalledTimes(1);
      expect(upsBatteryCacheService.getMultiple).toHaveBeenCalledWith(['ups-1', 'ups-2']);
    });

    it('should handle repository errors gracefully', async () => {
      upsRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute()).rejects.toThrow('Database error');

      expect(upsRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle null UPS list', async () => {
      upsRepository.findAll.mockResolvedValue(null as any);

      const result = await useCase.execute();

      expect(result.ups).toEqual([]);
      expect(result.summary).toEqual({
        total: 0,
        online: 0,
        onBattery: 0,
        offline: 0,
        unavailable: 0,
        averageLoad: null,
        isMocked: false,
      });
    });

    it('should handle large UPS list', async () => {
      const largeUpsList = Array.from({ length: 100 }, (_, i) => ({
        id: `ups-${i + 1}`,
        name: `UPS ${i + 1}`,
        location: `Location ${i + 1}`,
        model: 'Test Model',
      }));

      upsRepository.findAll.mockResolvedValue(largeUpsList as any);
      upsBatteryCacheService.getMultiple.mockResolvedValue({});

      const result = await useCase.execute();

      expect(result.ups).toHaveLength(100);
      expect(result.summary.total).toBe(100);
      expect(result.summary.unavailable).toBe(100);
    });

    it('should maintain consistent structure for all UPS entries', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);
      upsBatteryCacheService.getMultiple.mockResolvedValue({});

      const result = await useCase.execute();

      result.ups.forEach((ups) => {
        expect(ups).toHaveProperty('id');
        expect(ups).toHaveProperty('name');
        expect(ups).toHaveProperty('status');
        expect(ups).toHaveProperty('batteryLevel');
        expect(ups).toHaveProperty('load');
        expect(ups).toHaveProperty('runtime');
        expect(ups).toHaveProperty('temperature');
        expect(ups).toHaveProperty('lastTest');
        expect(ups).toHaveProperty('nextTest');
        expect(ups).toHaveProperty('isMocked');
        expect(ups.status).toBe('unavailable');
        expect(ups.isMocked).toBe(false);
      });
    });

    it('should calculate battery level correctly', async () => {
      upsRepository.findAll.mockResolvedValue([mockUpsList[0]] as any);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': {
          upsId: 'ups-1',
          ip: '192.168.1.100',
          minutesRemaining: 120,
          hoursRemaining: 2,
          alertLevel: 'normal',
          statusLabel: 'Normal',
          timestamp: new Date(),
        },
      });

      const result = await useCase.execute();

      expect(result.ups[0].batteryLevel).toBe(100);
    });

    it('should determine UPS status based on alert level', async () => {
      const testCases = [
        { alertLevel: 'critical', minutesRemaining: 5, expectedStatus: 'onBattery' },
        { alertLevel: 'warning', minutesRemaining: 15, expectedStatus: 'onBattery' },
        { alertLevel: 'low', minutesRemaining: 25, expectedStatus: 'onBattery' },
        { alertLevel: 'normal', minutesRemaining: 60, expectedStatus: 'online' },
      ];

      for (const testCase of testCases) {
        upsRepository.findAll.mockResolvedValue([mockUpsList[0]] as any);
        upsBatteryCacheService.getMultiple.mockResolvedValue({
          'ups-1': {
            upsId: 'ups-1',
            ip: '192.168.1.100',
            minutesRemaining: testCase.minutesRemaining,
            hoursRemaining: testCase.minutesRemaining / 60,
            alertLevel: testCase.alertLevel as 'normal' | 'low' | 'warning' | 'critical',
            statusLabel: testCase.alertLevel,
            timestamp: new Date(),
          },
        });

        const result = await useCase.execute();

        expect(result.ups[0].status).toBe(testCase.expectedStatus);
      }
    });
  });
});
