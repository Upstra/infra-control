import { Test, TestingModule } from '@nestjs/testing';
import { GetUpsStatusUseCase } from '../get-ups-status.use-case';
import { UpsRepositoryInterface } from '../../../../../ups/domain/interfaces/ups.repository.interface';

describe('GetUpsStatusUseCase', () => {
  let useCase: GetUpsStatusUseCase;
  let upsRepository: jest.Mocked<UpsRepositoryInterface>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUpsStatusUseCase,
        {
          provide: 'UpsRepositoryInterface',
          useValue: mockUpsRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUpsStatusUseCase>(GetUpsStatusUseCase);
    upsRepository = module.get('UpsRepositoryInterface');
  });

  describe('execute', () => {
    it('should return UPS status with correct structure', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);

      const result = await useCase.execute();

      expect(result).toHaveProperty('ups');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.ups)).toBe(true);
      expect(result.ups).toHaveLength(2);
    });

    it('should map UPS data correctly with mocked status', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);

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
        isMocked: true,
      });

      expect(result.ups[1]).toEqual({
        id: 'ups-2',
        name: 'Backup UPS',
        status: 'unavailable',
        batteryLevel: null,
        load: null,
        runtime: null,
        temperature: null,
        lastTest: null,
        nextTest: null,
        isMocked: true,
      });
    });

    it('should generate correct summary', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);

      const result = await useCase.execute();

      expect(result.summary).toEqual({
        total: 2,
        online: 0,
        onBattery: 0,
        offline: 0,
        unavailable: 2,
        averageLoad: null,
        isMocked: true,
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
        isMocked: true,
      });
    });

    it('should handle single UPS', async () => {
      const singleUps = [mockUpsList[0]];
      upsRepository.findAll.mockResolvedValue(singleUps as any);

      const result = await useCase.execute();

      expect(result.ups).toHaveLength(1);
      expect(result.summary.total).toBe(1);
      expect(result.summary.unavailable).toBe(1);
    });

    it('should call repository findAll method', async () => {
      upsRepository.findAll.mockResolvedValue(mockUpsList as any);

      await useCase.execute();

      expect(upsRepository.findAll).toHaveBeenCalledTimes(1);
      expect(upsRepository.findAll).toHaveBeenCalledWith();
    });
  });
});