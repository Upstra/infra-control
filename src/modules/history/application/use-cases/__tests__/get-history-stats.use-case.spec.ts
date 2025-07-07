import { Test, TestingModule } from '@nestjs/testing';
import { GetHistoryStatsUseCase } from '../get-history-stats.use-case';
import { HistoryRepositoryInterface } from '../../../domain/interfaces/history.repository.interface';

describe('GetHistoryStatsUseCase', () => {
  let useCase: GetHistoryStatsUseCase;
  let historyRepository: jest.Mocked<HistoryRepositoryInterface>;

  beforeEach(async () => {
    const mockHistoryRepository = {
      countCreatedByMonth: jest.fn(),
      save: jest.fn(),
      getList: jest.fn(),
      getEntityTypes: jest.fn(),
      getActionTypes: jest.fn(),
      getStatistics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetHistoryStatsUseCase,
        {
          provide: 'HistoryRepositoryInterface',
          useValue: mockHistoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetHistoryStatsUseCase>(GetHistoryStatsUseCase);
    historyRepository = module.get('HistoryRepositoryInterface');
  });

  describe('execute', () => {
    it('should return statistics for given entity and months', async () => {
      const mockStats = {
        '2024-01': 15,
        '2024-02': 23,
        '2024-03': 19,
      };

      historyRepository.countCreatedByMonth.mockResolvedValue(mockStats);

      const result = await useCase.execute('user', 3);

      expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith(
        'user',
        3,
      );
      expect(result).toEqual(mockStats);
    });

    it('should handle different entity types', async () => {
      const entities = ['user', 'server', 'vm', 'permission', 'role', 'group'];

      for (const entity of entities) {
        const mockStats = {
          '2024-01': Math.floor(Math.random() * 50),
          '2024-02': Math.floor(Math.random() * 50),
        };

        historyRepository.countCreatedByMonth.mockResolvedValue(mockStats);

        const result = await useCase.execute(entity, 2);

        expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith(
          entity,
          2,
        );
        expect(result).toEqual(mockStats);
      }
    });

    it('should handle different month values', async () => {
      const monthCases = [1, 3, 6, 12, 24, 36];

      for (const months of monthCases) {
        const mockStats: Record<string, number> = {};
        for (let i = 0; i < months; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          mockStats[key] = Math.floor(Math.random() * 100);
        }

        historyRepository.countCreatedByMonth.mockResolvedValue(mockStats);

        const result = await useCase.execute('server', months);

        expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith(
          'server',
          months,
        );
        expect(result).toEqual(mockStats);
      }
    });

    it('should return empty object when no data found', async () => {
      historyRepository.countCreatedByMonth.mockResolvedValue({});

      const result = await useCase.execute('nonexistent', 6);

      expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith(
        'nonexistent',
        6,
      );
      expect(result).toEqual({});
    });

    it('should handle repository errors', async () => {
      historyRepository.countCreatedByMonth.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(useCase.execute('user', 3)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle zero months', async () => {
      historyRepository.countCreatedByMonth.mockResolvedValue({});

      const result = await useCase.execute('user', 0);

      expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith(
        'user',
        0,
      );
      expect(result).toEqual({});
    });

    it('should handle negative months', async () => {
      historyRepository.countCreatedByMonth.mockResolvedValue({});

      const result = await useCase.execute('user', -5);

      expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith(
        'user',
        -5,
      );
      expect(result).toEqual({});
    });

    it('should handle special characters in entity name', async () => {
      const specialEntities = [
        'user-role',
        'permission_server',
        'vm.instance',
        'group/subgroup',
        'entity with spaces',
      ];

      for (const entity of specialEntities) {
        const mockStats = { '2024-01': 10 };
        historyRepository.countCreatedByMonth.mockResolvedValue(mockStats);

        const result = await useCase.execute(entity, 1);

        expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith(
          entity,
          1,
        );
        expect(result).toEqual(mockStats);
      }
    });

    it('should handle large month values', async () => {
      const mockStats: Record<string, number> = {};
      for (let i = 0; i < 120; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        mockStats[key] = i;
      }

      historyRepository.countCreatedByMonth.mockResolvedValue(mockStats);

      const result = await useCase.execute('server', 120);

      expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith(
        'server',
        120,
      );
      expect(Object.keys(result).length).toBe(120);
    });

    it('should handle repository returning null', async () => {
      historyRepository.countCreatedByMonth.mockResolvedValue(null as any);

      const result = await useCase.execute('user', 3);

      expect(result).toBeNull();
    });

    it('should handle repository returning undefined', async () => {
      historyRepository.countCreatedByMonth.mockResolvedValue(undefined as any);

      const result = await useCase.execute('user', 3);

      expect(result).toBeUndefined();
    });

    it('should handle concurrent calls', async () => {
      const mockStats1 = { '2024-01': 10 };
      const mockStats2 = { '2024-02': 20 };
      const mockStats3 = { '2024-03': 30 };

      historyRepository.countCreatedByMonth
        .mockResolvedValueOnce(mockStats1)
        .mockResolvedValueOnce(mockStats2)
        .mockResolvedValueOnce(mockStats3);

      const [result1, result2, result3] = await Promise.all([
        useCase.execute('user', 1),
        useCase.execute('server', 1),
        useCase.execute('vm', 1),
      ]);

      expect(result1).toEqual(mockStats1);
      expect(result2).toEqual(mockStats2);
      expect(result3).toEqual(mockStats3);
      expect(historyRepository.countCreatedByMonth).toHaveBeenCalledTimes(3);
    });

    it('should handle empty entity string', async () => {
      const mockStats = { '2024-01': 5 };
      historyRepository.countCreatedByMonth.mockResolvedValue(mockStats);

      const result = await useCase.execute('', 1);

      expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith('', 1);
      expect(result).toEqual(mockStats);
    });

    it('should handle fractional month values', async () => {
      const mockStats = { '2024-01': 15 };
      historyRepository.countCreatedByMonth.mockResolvedValue(mockStats);

      const result = await useCase.execute('user', 2.5);

      expect(historyRepository.countCreatedByMonth).toHaveBeenCalledWith(
        'user',
        2.5,
      );
      expect(result).toEqual(mockStats);
    });
  });
});
