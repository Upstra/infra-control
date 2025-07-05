import { Test, TestingModule } from '@nestjs/testing';
import { GetUpsListUseCase } from '../get-ups-list.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { Ups } from '../../../domain/entities/ups.entity';
import { UpsResponseDto } from '../../dto/ups.response.dto';
import { UpsListResponseDto } from '../../dto';

describe('GetUpsListUseCase', () => {
  let useCase: GetUpsListUseCase;
  let repository: UpsRepositoryInterface;

  const mockUpsRepository = {
    paginateWithServerCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUpsListUseCase,
        {
          provide: 'UpsRepositoryInterface',
          useValue: mockUpsRepository,
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
        login: 'admin',
        password: 'password',
        grace_period_on: 10,
        grace_period_off: 5,
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
  });
});
