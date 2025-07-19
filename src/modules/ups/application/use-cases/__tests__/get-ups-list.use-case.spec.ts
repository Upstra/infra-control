import { Test, TestingModule } from '@nestjs/testing';
import { GetUpsListUseCase } from '../get-ups-list.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { Ups } from '../../../domain/entities/ups.entity';
import { UpsResponseDto } from '../../dto/ups.response.dto';
import { UpsListResponseDto } from '../../dto';
import { GetUpsBatteryUseCase } from '../get-ups-battery.use-case';
import { UPSBatteryStatusDto } from '../../../domain/interfaces/ups-battery-status.interface';

describe('GetUpsListUseCase', () => {
  let useCase: GetUpsListUseCase;
  let repository: UpsRepositoryInterface;

  const mockUpsRepository = {
    paginateWithServerCount: jest.fn(),
  };

  const mockGetUpsBatteryUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUpsListUseCase,
        {
          provide: 'UpsRepositoryInterface',
          useValue: mockUpsRepository,
        },
        {
          provide: GetUpsBatteryUseCase,
          useValue: mockGetUpsBatteryUseCase,
        },
      ],
    }).compile();

    useCase = module.get<GetUpsListUseCase>(GetUpsListUseCase);
    repository = module.get<UpsRepositoryInterface>('UpsRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return paginated UPS list with server count', async () => {
      const mockUps: Ups = {
        id: '1',
        name: 'UPS 1',
        ip: '192.168.1.100',
        roomId: 'room-1',
        servers: [],
        room: null,
      } as Ups;

      const mockData = [
        { ups: mockUps, serverCount: 5 },
        { ups: { ...mockUps, id: '2', name: 'UPS 2' }, serverCount: 3 },
      ];
      const total = 10;

      mockUpsRepository.paginateWithServerCount.mockResolvedValueOnce([
        mockData,
        total,
      ]);

      const result = await useCase.execute(1, 10);

      expect(repository.paginateWithServerCount).toHaveBeenCalledWith(1, 10);
      expect(result).toBeInstanceOf(UpsListResponseDto);
      expect(result.totalItems).toBe(total);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1); // 10 items / 10 per page = 1 page
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toBeInstanceOf(UpsResponseDto);
      expect(result.items[0].serverCount).toBe(5);
      expect(result.items[1].serverCount).toBe(3);
    });

    it('should use default pagination values', async () => {
      mockUpsRepository.paginateWithServerCount.mockResolvedValueOnce([[], 0]);

      await useCase.execute();

      expect(repository.paginateWithServerCount).toHaveBeenCalledWith(1, 10);
    });

    it('should handle empty results', async () => {
      mockUpsRepository.paginateWithServerCount.mockResolvedValueOnce([[], 0]);

      const result = await useCase.execute(1, 10);

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
    });

    it('should fetch battery status for each UPS', async () => {
      const mockUps: Ups = {
        id: '1',
        name: 'UPS 1',
        ip: '192.168.1.100',
        roomId: 'room-1',
        servers: [],
        room: null,
      } as Ups;

      const mockBatteryStatus: UPSBatteryStatusDto = {
        upsId: '1',
        ip: '192.168.1.100',
        minutesRemaining: 45,
        hoursRemaining: 0.75,
        alertLevel: 'normal',
        statusLabel: 'Battery Normal',
        timestamp: new Date(),
      };

      const mockData = [{ ups: mockUps, serverCount: 5 }];

      mockUpsRepository.paginateWithServerCount.mockResolvedValueOnce([
        mockData,
        1,
      ]);
      mockGetUpsBatteryUseCase.execute.mockResolvedValueOnce(mockBatteryStatus);

      const result = await useCase.execute(1, 10);

      expect(mockGetUpsBatteryUseCase.execute).toHaveBeenCalledWith('1');
      expect(result.items[0].batteryStatus).toBeDefined();
      expect(result.items[0].batteryStatus.minutesRemaining).toBe(45);
      expect(result.items[0].batteryStatus.alertLevel).toBe('normal');
    });

    it('should handle battery status fetch errors gracefully', async () => {
      const mockUps: Ups = {
        id: '1',
        name: 'UPS 1',
        ip: '192.168.1.100',
        roomId: 'room-1',
        servers: [],
        room: null,
      } as Ups;

      const mockData = [{ ups: mockUps, serverCount: 5 }];

      mockUpsRepository.paginateWithServerCount.mockResolvedValueOnce([
        mockData,
        1,
      ]);
      mockGetUpsBatteryUseCase.execute.mockRejectedValueOnce(
        new Error('Battery check failed'),
      );

      const result = await useCase.execute(1, 10);

      expect(mockGetUpsBatteryUseCase.execute).toHaveBeenCalledWith('1');
      expect(result.items[0].batteryStatus).toBeUndefined();
      expect(result.items[0].id).toBe('1');
      expect(result.items[0].serverCount).toBe(5);
    });

    it('should fetch battery status for multiple UPS devices', async () => {
      const mockUps1: Ups = {
        id: '1',
        name: 'UPS 1',
        ip: '192.168.1.100',
        roomId: 'room-1',
        servers: [],
        room: null,
      } as Ups;

      const mockUps2: Ups = {
        id: '2',
        name: 'UPS 2',
        ip: '192.168.1.101',
        roomId: 'room-2',
        servers: [],
        room: null,
      } as Ups;

      const mockBatteryStatus1: UPSBatteryStatusDto = {
        upsId: '1',
        ip: '192.168.1.100',
        minutesRemaining: 45,
        hoursRemaining: 0.75,
        alertLevel: 'normal',
        statusLabel: 'Battery Normal',
        timestamp: new Date(),
      };

      const mockBatteryStatus2: UPSBatteryStatusDto = {
        upsId: '2',
        ip: '192.168.1.101',
        minutesRemaining: 10,
        hoursRemaining: 0.167,
        alertLevel: 'warning',
        statusLabel: 'Battery Warning',
        timestamp: new Date(),
      };

      const mockData = [
        { ups: mockUps1, serverCount: 5 },
        { ups: mockUps2, serverCount: 3 },
      ];

      mockUpsRepository.paginateWithServerCount.mockResolvedValueOnce([
        mockData,
        2,
      ]);
      mockGetUpsBatteryUseCase.execute
        .mockResolvedValueOnce(mockBatteryStatus1)
        .mockResolvedValueOnce(mockBatteryStatus2);

      const result = await useCase.execute(1, 10);

      expect(mockGetUpsBatteryUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockGetUpsBatteryUseCase.execute).toHaveBeenCalledWith('1');
      expect(mockGetUpsBatteryUseCase.execute).toHaveBeenCalledWith('2');

      expect(result.items[0].batteryStatus.alertLevel).toBe('normal');
      expect(result.items[1].batteryStatus.alertLevel).toBe('warning');
      expect(result.items[1].batteryStatus.minutesRemaining).toBe(10);
    });
  });
});
