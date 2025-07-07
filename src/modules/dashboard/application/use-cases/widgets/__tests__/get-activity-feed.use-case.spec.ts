import { Test, TestingModule } from '@nestjs/testing';
import { GetActivityFeedUseCase } from '../get-activity-feed.use-case';
import { HistoryRepositoryInterface } from '@/modules/history/domain/interfaces/history.repository.interface';
import { HistoryEvent } from '@/modules/history/domain/entities/history-event.entity';
import { WidgetDataQueryDto } from '../../../dto/widget-data.dto';
import { User } from '@/modules/users/domain/entities/user.entity';

describe('GetActivityFeedUseCase', () => {
  let useCase: GetActivityFeedUseCase;
  let historyRepository: jest.Mocked<HistoryRepositoryInterface>;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
  };

  const mockHistoryEvents: Partial<HistoryEvent>[] = [
    {
      id: 'event-1',
      entity: 'server',
      entityId: 'server-123',
      action: 'created',
      userId: 'user-123',
      user: mockUser as User,
      newValue: { name: 'Production Server' },
      oldValue: null,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      metadata: {},
    },
    {
      id: 'event-2',
      entity: 'vm',
      entityId: 'vm-456',
      action: 'updated',
      userId: 'user-456',
      user: { id: 'user-456', email: 'admin@example.com' } as User,
      newValue: { name: 'Test VM', status: 'running' },
      oldValue: { name: 'Test VM', status: 'stopped' },
      createdAt: new Date('2024-01-15T09:30:00Z'),
      metadata: {},
    },
    {
      id: 'event-3',
      entity: 'user',
      entityId: 'user-789',
      action: 'deleted',
      userId: null,
      user: null,
      newValue: null,
      oldValue: { name: 'Deleted User' },
      createdAt: new Date('2024-01-15T09:00:00Z'),
      metadata: {},
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActivityFeedUseCase,
        {
          provide: 'HistoryRepositoryInterface',
          useValue: {
            paginate: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetActivityFeedUseCase>(GetActivityFeedUseCase);
    historyRepository = module.get('HistoryRepositoryInterface');
  });

  describe('execute', () => {
    it('should return activity feed with default pagination', async () => {
      const query: WidgetDataQueryDto = {};
      historyRepository.paginate.mockResolvedValue([mockHistoryEvents as any, 3]);

      const result = await useCase.execute(query);

      expect(historyRepository.paginate).toHaveBeenCalledWith(
        1,
        20,
        ['user'],
        {},
      );
      expect(result.activities).toHaveLength(3);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 3,
      });
    });

    it('should use custom pagination parameters', async () => {
      const query: WidgetDataQueryDto = {
        page: 2,
        limit: 50,
      };
      historyRepository.paginate.mockResolvedValue([mockHistoryEvents as any, 100]);

      const result = await useCase.execute(query);

      expect(historyRepository.paginate).toHaveBeenCalledWith(
        2,
        50,
        ['user'],
        {},
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 50,
        total: 100,
      });
    });

    it('should filter by date range', async () => {
      const query: WidgetDataQueryDto = {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      };
      historyRepository.paginate.mockResolvedValue([mockHistoryEvents as any, 3]);

      const result = await useCase.execute(query);

      expect(historyRepository.paginate).toHaveBeenCalledWith(
        1,
        20,
        ['user'],
        {
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-01-31'),
        },
      );
    });

    it('should handle dateFrom filter only', async () => {
      const query: WidgetDataQueryDto = {
        dateFrom: '2024-01-15',
      };
      historyRepository.paginate.mockResolvedValue([mockHistoryEvents.slice(0, 2) as any, 2]);

      const result = await useCase.execute(query);

      expect(historyRepository.paginate).toHaveBeenCalledWith(
        1,
        20,
        ['user'],
        {
          dateFrom: new Date('2024-01-15'),
        },
      );
    });

    it('should handle dateTo filter only', async () => {
      const query: WidgetDataQueryDto = {
        dateTo: '2024-01-15',
      };
      historyRepository.paginate.mockResolvedValue([mockHistoryEvents as any, 3]);

      const result = await useCase.execute(query);

      expect(historyRepository.paginate).toHaveBeenCalledWith(
        1,
        20,
        ['user'],
        {
          dateTo: new Date('2024-01-15'),
        },
      );
    });

    it('should map history events to activity feed format', async () => {
      const query: WidgetDataQueryDto = {};
      historyRepository.paginate.mockResolvedValue([[mockHistoryEvents[0]] as any, 1]);

      const result = await useCase.execute(query);

      expect(result.activities[0]).toEqual({
        id: 'event-1',
        type: 'server_created',
        actor: {
          id: 'user-123',
          name: 'test@example.com',
          avatar: undefined,
        },
        target: {
          type: 'server',
          id: 'server-123',
          name: 'Production Server',
        },
        timestamp: new Date('2024-01-15T10:00:00Z'),
        description: 'serveur créé',
      });
    });

    it('should handle system events without user', async () => {
      const query: WidgetDataQueryDto = {};
      historyRepository.paginate.mockResolvedValue([[mockHistoryEvents[2]] as any, 1]);

      const result = await useCase.execute(query);

      expect(result.activities[0].actor).toEqual({
        id: 'system',
        name: 'System',
        avatar: undefined,
      });
    });

    it('should generate proper descriptions for different actions', async () => {
      const query: WidgetDataQueryDto = {};
      historyRepository.paginate.mockResolvedValue([mockHistoryEvents as any, 3]);

      const result = await useCase.execute(query);

      expect(result.activities[0].description).toBe('serveur créé');
      expect(result.activities[1].description).toBe('VM mis à jour');
      expect(result.activities[2].description).toBe('utilisateur supprimé');
    });

    it('should handle events without name in newValue', async () => {
      const eventWithoutName = {
        id: 'event-4',
        entity: 'group',
        entityId: 'group-123',
        action: 'created',
        userId: 'user-123',
        user: mockUser as User,
        newValue: { description: 'Test group' },
        oldValue: null,
        createdAt: new Date(),
        metadata: {},
      };

      historyRepository.paginate.mockResolvedValue([[eventWithoutName as any], 1]);

      const result = await useCase.execute({});

      expect(result.activities[0].target.name).toBe('group-123');
    });

    it('should handle unknown entity and action types', async () => {
      const unknownEvent = {
        id: 'event-5',
        entity: 'unknown_entity',
        entityId: 'unknown-123',
        action: 'unknown_action',
        userId: 'user-123',
        user: mockUser as User,
        newValue: null,
        oldValue: null,
        createdAt: new Date(),
        metadata: {},
      };

      historyRepository.paginate.mockResolvedValue([[unknownEvent as any], 1]);

      const result = await useCase.execute({});

      expect(result.activities[0].type).toBe('unknown_entity_unknown_action');
      expect(result.activities[0].description).toBe('unknown_entity unknown_action');
    });

    it('should handle empty result set', async () => {
      const query: WidgetDataQueryDto = { page: 10, limit: 20 };
      historyRepository.paginate.mockResolvedValue([[], 0]);

      const result = await useCase.execute(query);

      expect(result.activities).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle repository errors', async () => {
      const query: WidgetDataQueryDto = {};
      const error = new Error('Database error');
      historyRepository.paginate.mockRejectedValue(error);

      await expect(useCase.execute(query)).rejects.toThrow(error);
    });

    it('should handle all entity types correctly', async () => {
      const entities = ['server', 'vm', 'user', 'group', 'room'];
      const events = entities.map((entity, index) => ({
        id: `event-${index}`,
        entity,
        entityId: `${entity}-123`,
        action: 'created',
        userId: 'user-123',
        user: mockUser as User,
        newValue: { name: `Test ${entity}` },
        oldValue: null,
        createdAt: new Date(),
        metadata: {},
      } as any));

      historyRepository.paginate.mockResolvedValue([events as any, events.length]);

      const result = await useCase.execute({});

      expect(result.activities[0].description).toBe('serveur créé');
      expect(result.activities[1].description).toBe('VM créé');
      expect(result.activities[2].description).toBe('utilisateur créé');
      expect(result.activities[3].description).toBe('groupe créé');
      expect(result.activities[4].description).toBe('salle créé');
    });
  });
});