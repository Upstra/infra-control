import { Test, TestingModule } from '@nestjs/testing';
import { GetHistoryStatisticsUseCase } from '../get-history-statistics.use-case';
import { HistoryRepositoryInterface } from '../../../domain/interfaces/history.repository.interface';

describe('GetHistoryStatisticsUseCase', () => {
  let useCase: GetHistoryStatisticsUseCase;
  let historyRepository: jest.Mocked<HistoryRepositoryInterface>;

  beforeEach(async () => {
    const mockHistoryRepository = {
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetHistoryStatisticsUseCase,
        {
          provide: 'HistoryRepositoryInterface',
          useValue: mockHistoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetHistoryStatisticsUseCase>(
      GetHistoryStatisticsUseCase,
    );
    historyRepository = module.get('HistoryRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return history statistics', async () => {
      const mockStats = {
        totalEvents: 15234,
        eventsByEntity: {
          server: 5432,
          ups: 3210,
          room: 2156,
        },
        eventsByAction: {
          create: 4532,
          update: 8765,
          delete: 1937,
        },
        activityTrends: [
          { date: '2025-01-01', count: 234 },
          { date: '2025-01-02', count: 312 },
          { date: '2025-01-03', count: 289 },
        ],
        topUsers: [
          { userId: '123', username: 'john.doe', count: 543 },
          { userId: '456', username: 'jane.smith', count: 421 },
        ],
      };

      historyRepository.getStats.mockResolvedValue(mockStats);

      const result = await useCase.execute();

      expect(result).toEqual(mockStats);
      expect(historyRepository.getStats).toHaveBeenCalledTimes(1);
      expect(historyRepository.getStats).toHaveBeenCalledWith();
    });

    it('should handle empty statistics', async () => {
      const emptyStats = {
        totalEvents: 0,
        eventsByEntity: {},
        eventsByAction: {},
        activityTrends: [],
        topUsers: [],
      };

      historyRepository.getStats.mockResolvedValue(emptyStats);

      const result = await useCase.execute();

      expect(result).toEqual(emptyStats);
      expect(historyRepository.getStats).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Database connection failed');
      historyRepository.getStats.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(error);
      expect(historyRepository.getStats).toHaveBeenCalledTimes(1);
    });

    it('should pass through all statistics data without modification', async () => {
      const complexStats = {
        totalEvents: 999999,
        eventsByEntity: {
          server: 100,
          vm: 200,
          ups: 300,
          room: 400,
          rack: 500,
          switch: 600,
        },
        eventsByAction: {
          CREATE: 1000,
          UPDATE: 2000,
          DELETE: 3000,
          RESTORE: 4000,
          ARCHIVE: 5000,
        },
        activityTrends: Array.from({ length: 30 }, (_, i) => ({
          date: `2025-01-${String(i + 1).padStart(2, '0')}`,
          count: Math.floor(Math.random() * 1000),
        })),
        topUsers: Array.from({ length: 10 }, (_, i) => ({
          userId: `user-${i}`,
          username: `user${i}`,
          count: 1000 - i * 100,
        })),
      };

      historyRepository.getStats.mockResolvedValue(complexStats);

      const result = await useCase.execute();

      expect(result).toStrictEqual(complexStats);
      expect(result.totalEvents).toBe(complexStats.totalEvents);
      expect(result.eventsByEntity).toStrictEqual(complexStats.eventsByEntity);
      expect(result.eventsByAction).toStrictEqual(complexStats.eventsByAction);
      expect(result.activityTrends).toStrictEqual(complexStats.activityTrends);
      expect(result.topUsers).toStrictEqual(complexStats.topUsers);
    });
  });
});
