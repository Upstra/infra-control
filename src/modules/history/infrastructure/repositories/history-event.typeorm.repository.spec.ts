import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { HistoryEventTypeormRepository } from './history-event.typeorm.repository';
import { HistoryEvent } from '../../domain/entities/history-event.entity';

describe('HistoryEventTypeormRepository', () => {
  let repository: HistoryEventTypeormRepository;
  let dataSource: DataSource;
  let mockRepository: jest.Mocked<Repository<HistoryEvent>>;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  const mockDataSource = {
    createEntityManager: jest.fn(),
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    mockRepository = {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    mockDataSource.getRepository.mockReturnValue(mockRepository);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryEventTypeormRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<HistoryEventTypeormRepository>(
      HistoryEventTypeormRepository,
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return complete statistics data', async () => {
      const mockTotalEvents = 150;
      const mockEventsByEntity = [
        { entity: 'server', count: '50' },
        { entity: 'vm', count: '30' },
        { entity: 'room', count: '20' },
      ];
      const mockEventsByAction = [
        { action: 'CREATE', count: '40' },
        { action: 'UPDATE', count: '60' },
        { action: 'DELETE', count: '50' },
      ];
      const mockActivityTrends = [
        { date: '2025-01-01', count: '10' },
        { date: '2025-01-02', count: '15' },
        { date: '2025-01-03', count: '12' },
      ];
      const mockTopUsers = [
        { userId: 'user1', username: 'john.doe', count: '25' },
        { userId: 'user2', username: 'jane.smith', count: '20' },
        { userId: 'user3', username: 'bob.wilson', count: '15' },
      ];

      mockRepository.count.mockResolvedValue(mockTotalEvents);

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockEventsByEntity)
        .mockResolvedValueOnce(mockEventsByAction)
        .mockResolvedValueOnce(mockActivityTrends)
        .mockResolvedValueOnce(mockTopUsers);

      const result = await repository.getStats();

      expect(result).toEqual({
        totalEvents: 150,
        eventsByEntity: {
          server: 50,
          vm: 30,
          room: 20,
        },
        eventsByAction: {
          CREATE: 40,
          UPDATE: 60,
          DELETE: 50,
        },
        activityTrends: [
          { date: '2025-01-01', count: 10 },
          { date: '2025-01-02', count: 15 },
          { date: '2025-01-03', count: 12 },
        ],
        topUsers: [
          { userId: 'user1', username: 'john.doe', count: 25 },
          { userId: 'user2', username: 'jane.smith', count: 20 },
          { userId: 'user3', username: 'bob.wilson', count: 15 },
        ],
      });

      expect(mockRepository.count).toHaveBeenCalledTimes(1);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(4);
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalledTimes(4);
    });

    it('should handle empty data gracefully', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await repository.getStats();

      expect(result).toEqual({
        totalEvents: 0,
        eventsByEntity: {},
        eventsByAction: {},
        activityTrends: [],
        topUsers: [],
      });
    });

    it('should filter activity trends to last 30 days', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await repository.getStats();

      const whereCall = mockQueryBuilder.where.mock.calls[0];
      expect(whereCall[0]).toBe('history."createdAt" >= :thirtyDaysAgo');
      expect(whereCall[1]).toHaveProperty('thirtyDaysAgo');

      const thirtyDaysAgo = whereCall[1].thirtyDaysAgo as Date;
      const now = new Date();
      const daysDiff = Math.round(
        (now.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(30);
    });

    it('should limit top users to 10', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await repository.getStats();

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should order results correctly', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await repository.getStats();

      expect(mockQueryBuilder.orderBy).toHaveBeenNthCalledWith(
        1,
        'history."createdAt"::date',
        'ASC',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenNthCalledWith(
        2,
        'count',
        'DESC',
      );
    });
  });

  describe('countCreatedByMonth', () => {
    it('should count created events by month', async () => {
      const mockResults = [
        { month: '2024-11', count: '15' },
        { month: '2024-12', count: '23' },
        { month: '2025-01', count: '8' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      const result = await repository.countCreatedByMonth('server', 3);

      expect(result).toEqual({
        '2024-11': 15,
        '2024-12': 23,
        '2025-01': 8,
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'history.entity = :entity',
        { entity: 'server' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'history.action = :action',
        { action: 'CREATE' },
      );
    });
  });

  describe('paginate', () => {
    it('should paginate with filters', async () => {
      const mockEvents = [
        { id: '1', entity: 'server', action: 'CREATE' },
        { id: '2', entity: 'vm', action: 'UPDATE' },
      ];
      const mockTotal = 50;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        mockEvents,
        mockTotal,
      ]);

      const filters = {
        action: 'CREATE',
        entity: 'server',
        userId: 'user123',
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      const result = await repository.paginate(2, 10, ['user'], filters);

      expect(result).toEqual([mockEvents, mockTotal]);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'history.user',
        'user',
      );
    });

    it('should handle multiple action filters', async () => {
      const mockEvents = [];
      const mockTotal = 0;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        mockEvents,
        mockTotal,
      ]);

      const filters = {
        action: ['CREATE', 'UPDATE', 'DELETE'],
      };

      await repository.paginate(1, 10, [], filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'history.action IN (:...actions)',
        { actions: ['CREATE', 'UPDATE', 'DELETE'] },
      );
    });

    it('should apply sort and order', async () => {
      const mockEvents = [];
      const mockTotal = 0;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        mockEvents,
        mockTotal,
      ]);

      const filters = {
        sort: 'entity',
        order: 'asc' as const,
      };

      await repository.paginate(1, 10, [], filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'history.entity',
        'ASC',
      );
    });
  });

  describe('findDistinctEntityTypes', () => {
    it('should return distinct entity types', async () => {
      const mockResults = [
        { entity: 'server' },
        { entity: 'vm' },
        { entity: 'room' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      const result = await repository.findDistinctEntityTypes();

      expect(result).toEqual(['server', 'vm', 'room']);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'DISTINCT history.entity',
        'entity',
      );
    });
  });

  describe('findDistinctActionTypes', () => {
    it('should return distinct action types sorted alphabetically', async () => {
      const mockResults = [
        { action: 'CREATE' },
        { action: 'DELETE' },
        { action: 'UPDATE' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      const result = await repository.findDistinctActionTypes();

      expect(result).toEqual(['CREATE', 'DELETE', 'UPDATE']);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'DISTINCT history.action',
        'action',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'history.action',
        'ASC',
      );
    });
  });
});
