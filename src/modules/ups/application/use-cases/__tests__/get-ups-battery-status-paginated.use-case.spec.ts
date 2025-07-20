import { Test, TestingModule } from '@nestjs/testing';
import { GetUpsBatteryStatusPaginatedUseCase } from '../get-ups-battery-status-paginated.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { UpsBatteryCacheService } from '../../services/ups-battery-cache.service';
import { GetUpsBatteryUseCase } from '../get-ups-battery.use-case';
import { UPSBatteryStatusDto } from '../../../domain/interfaces/ups-battery-status.interface';
import { Ups } from '../../../domain/entities/ups.entity';

describe('GetUpsBatteryStatusPaginatedUseCase', () => {
  let useCase: GetUpsBatteryStatusPaginatedUseCase;
  let upsRepository: jest.Mocked<UpsRepositoryInterface>;
  let upsBatteryCacheService: jest.Mocked<UpsBatteryCacheService>;
  let getUpsBatteryUseCase: jest.Mocked<GetUpsBatteryUseCase>;

  const mockUps1: Ups = {
    id: 'ups-1',
    name: 'UPS 1',
    ip: '192.168.1.10',
    grace_period_on: 300,
    grace_period_off: 600,
    servers: [],
    room: null,
    roomId: 'room-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Ups;

  const mockUps2: Ups = {
    id: 'ups-2',
    name: 'UPS 2',
    ip: '192.168.1.20',
    grace_period_on: 300,
    grace_period_off: 600,
    servers: [],
    room: null,
    roomId: 'room-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Ups;

  const mockUps3: Ups = {
    id: 'ups-3',
    name: 'UPS 3',
    ip: '192.168.1.30',
    grace_period_on: 300,
    grace_period_off: 600,
    servers: [],
    room: null,
    roomId: 'room-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Ups;

  const mockBatteryStatus1: UPSBatteryStatusDto = {
    upsId: 'ups-1',
    ip: '192.168.1.10',
    minutesRemaining: 45,
    hoursRemaining: 0.75,
    alertLevel: 'normal',
    statusLabel: 'Normal',
    timestamp: new Date('2023-06-01'),
  };

  const mockBatteryStatus2: UPSBatteryStatusDto = {
    upsId: 'ups-2',
    ip: '192.168.1.20',
    minutesRemaining: 20,
    hoursRemaining: 0.33,
    alertLevel: 'warning',
    statusLabel: 'Battery Low',
    timestamp: new Date('2023-06-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUpsBatteryStatusPaginatedUseCase,
        {
          provide: 'UpsRepositoryInterface',
          useValue: {
            paginate: jest.fn(),
          },
        },
        {
          provide: UpsBatteryCacheService,
          useValue: {
            getMultiple: jest.fn(),
          },
        },
        {
          provide: GetUpsBatteryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetUpsBatteryStatusPaginatedUseCase>(
      GetUpsBatteryStatusPaginatedUseCase,
    );
    upsRepository = module.get('UpsRepositoryInterface');
    upsBatteryCacheService = module.get(UpsBatteryCacheService);
    getUpsBatteryUseCase = module.get(GetUpsBatteryUseCase);
  });

  describe('execute', () => {
    it('should return paginated battery status from cache', async () => {
      upsRepository.paginate.mockResolvedValue([[mockUps1, mockUps2], 2]);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': mockBatteryStatus1,
        'ups-2': mockBatteryStatus2,
      });

      const result = await useCase.execute();

      expect(upsRepository.paginate).toHaveBeenCalledWith(1, 10);
      expect(upsBatteryCacheService.getMultiple).toHaveBeenCalledWith([
        'ups-1',
        'ups-2',
      ]);
      expect(getUpsBatteryUseCase.execute).not.toHaveBeenCalled();

      expect(result).toEqual({
        data: [
          { ...mockBatteryStatus1, upsName: 'UPS 1' },
          { ...mockBatteryStatus2, upsName: 'UPS 2' },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should handle custom page and limit', async () => {
      upsRepository.paginate.mockResolvedValue([[mockUps1], 5]);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': mockBatteryStatus1,
      });

      const result = await useCase.execute(2, 2);

      expect(upsRepository.paginate).toHaveBeenCalledWith(2, 2);
      expect(result).toEqual({
        data: [{ ...mockBatteryStatus1, upsName: 'UPS 1' }],
        total: 5,
        page: 2,
        limit: 2,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should fetch missing data from use case', async () => {
      upsRepository.paginate.mockResolvedValue([
        [mockUps1, mockUps2, mockUps3],
        3,
      ]);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': mockBatteryStatus1,
        'ups-2': null,
        'ups-3': undefined,
      });
      getUpsBatteryUseCase.execute
        .mockResolvedValueOnce(mockBatteryStatus2) // for ups-2
        .mockResolvedValueOnce(mockBatteryStatus1); // for ups-3

      const result = await useCase.execute();

      expect(getUpsBatteryUseCase.execute).toHaveBeenCalledTimes(2);
      expect(getUpsBatteryUseCase.execute).toHaveBeenCalledWith('ups-2');
      expect(getUpsBatteryUseCase.execute).toHaveBeenCalledWith('ups-3');

      expect(result.data).toHaveLength(3);
    });

    it('should force refresh all data when forceRefresh is true', async () => {
      upsRepository.paginate.mockResolvedValue([[mockUps1, mockUps2], 2]);
      getUpsBatteryUseCase.execute
        .mockResolvedValueOnce(mockBatteryStatus1)
        .mockResolvedValueOnce(mockBatteryStatus2);

      const result = await useCase.execute(1, 10, true);

      expect(upsBatteryCacheService.getMultiple).not.toHaveBeenCalled();
      expect(getUpsBatteryUseCase.execute).toHaveBeenCalledTimes(2);
      expect(getUpsBatteryUseCase.execute).toHaveBeenCalledWith('ups-1');
      expect(getUpsBatteryUseCase.execute).toHaveBeenCalledWith('ups-2');

      expect(result.data).toHaveLength(2);
    });

    it('should handle errors gracefully when fetching battery status', async () => {
      upsRepository.paginate.mockResolvedValue([[mockUps1, mockUps2], 2]);
      upsBatteryCacheService.getMultiple.mockResolvedValue({});
      getUpsBatteryUseCase.execute
        .mockRejectedValueOnce(new Error('UPS connection failed'))
        .mockResolvedValueOnce(mockBatteryStatus2);

      const result = await useCase.execute();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        ...mockBatteryStatus2,
        upsName: 'UPS 2',
      });
    });

    it('should handle errors during force refresh', async () => {
      upsRepository.paginate.mockResolvedValue([[mockUps1, mockUps2], 2]);
      getUpsBatteryUseCase.execute
        .mockRejectedValueOnce(new Error('UPS 1 error'))
        .mockResolvedValueOnce(mockBatteryStatus2);

      const result = await useCase.execute(1, 10, true);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        ...mockBatteryStatus2,
        upsName: 'UPS 2',
      });
    });

    it('should handle empty UPS list', async () => {
      upsRepository.paginate.mockResolvedValue([[], 0]);

      const result = await useCase.execute();

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should filter out null battery statuses', async () => {
      upsRepository.paginate.mockResolvedValue([[mockUps1, mockUps2], 2]);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': mockBatteryStatus1,
        'ups-2': null,
      });

      const result = await useCase.execute();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].upsName).toBe('UPS 1');
    });

    it('should calculate pagination correctly for last page', async () => {
      upsRepository.paginate.mockResolvedValue([[mockUps1], 21]);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': mockBatteryStatus1,
      });

      const result = await useCase.execute(3, 10);

      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should handle first page correctly', async () => {
      upsRepository.paginate.mockResolvedValue([[mockUps1, mockUps2], 20]);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': mockBatteryStatus1,
        'ups-2': mockBatteryStatus2,
      });

      const result = await useCase.execute(1, 10);

      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should handle all UPS having null status', async () => {
      upsRepository.paginate.mockResolvedValue([[mockUps1, mockUps2], 2]);
      upsBatteryCacheService.getMultiple.mockResolvedValue({});
      getUpsBatteryUseCase.execute.mockRejectedValue(
        new Error('Connection failed'),
      );

      const result = await useCase.execute();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(2);
    });

    it('should handle mixed cache and fetch results', async () => {
      upsRepository.paginate.mockResolvedValue([
        [mockUps1, mockUps2, mockUps3],
        3,
      ]);
      upsBatteryCacheService.getMultiple.mockResolvedValue({
        'ups-1': mockBatteryStatus1,
        'ups-2': undefined,
        'ups-3': null,
      });
      getUpsBatteryUseCase.execute
        .mockResolvedValueOnce(mockBatteryStatus2) // ups-2
        .mockRejectedValueOnce(new Error('Failed')); // ups-3

      const result = await useCase.execute();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].upsName).toBe('UPS 1');
      expect(result.data[1].upsName).toBe('UPS 2');
    });
  });
});