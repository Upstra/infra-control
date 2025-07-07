import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from '../history.controller';
import { GetHistoryListUseCase } from '../../use-cases/get-history-list.use-case';
import { GetHistoryEntityTypesUseCase } from '../../use-cases/get-entity-types.use-case';
import { GetHistoryStatisticsUseCase } from '../../use-cases/get-history-statistics.use-case';
import { GetHistoryActionTypesUseCase } from '../../use-cases/get-action-types.use-case';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { EntityTypesResponseDto } from '../../dto/entity-types.response.dto';
import { HistoryEventResponseDto } from '../../dto/history-event.response.dto';
import { HistoryListResponseDto } from '../../dto/history.list.response.dto';
import { HistoryEvent } from '../../../domain/entities/history-event.entity';
import { HistoryStatsResponseDto } from '../../dto/history-stats-response.dto';
import { ActionTypesResponseDto } from '../../dto/action-types.response.dto';

describe('HistoryController', () => {
  let controller: HistoryController;
  let getList: jest.Mocked<GetHistoryListUseCase>;
  let getEntityTypesUseCase: jest.Mocked<GetHistoryEntityTypesUseCase>;
  let getHistoryStatisticsUseCase: jest.Mocked<GetHistoryStatisticsUseCase>;
  let getHistoryActionTypesUseCase: jest.Mocked<GetHistoryActionTypesUseCase>;

  beforeEach(async () => {
    getList = { execute: jest.fn() } as any;
    getEntityTypesUseCase = { execute: jest.fn() } as any;
    getHistoryStatisticsUseCase = { execute: jest.fn() } as any;
    getHistoryActionTypesUseCase = { execute: jest.fn() } as any;
    const mockJwtGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockRoleGuard = { canActivate: jest.fn().mockReturnValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [
        { provide: GetHistoryListUseCase, useValue: getList },
        {
          provide: GetHistoryEntityTypesUseCase,
          useValue: getEntityTypesUseCase,
        },
        {
          provide: GetHistoryStatisticsUseCase,
          useValue: getHistoryStatisticsUseCase,
        },
        {
          provide: GetHistoryActionTypesUseCase,
          useValue: getHistoryActionTypesUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get(HistoryController);
  });

  describe('getHistory', () => {
    it('returns paginated history', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      const result = await controller.getHistory('2', '5');
      expect(getList.execute).toHaveBeenCalledWith(2, 5, {});
      expect(result).toBe(mock);
    });

    it('uses defaults', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      const result = await controller.getHistory();
      expect(getList.execute).toHaveBeenCalledWith(1, 20, {});
      expect(result).toBe(mock);
    });

    it('passes filters to use case', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      await controller.getHistory(
        '1',
        '10',
        'CREATE',
        'role',
        'user',
        '2024-01-01',
        '2024-01-31',
      );
      expect(getList.execute).toHaveBeenCalledWith(1, 10, {
        action: 'CREATE',
        entity: 'role',
        userId: 'user',
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });
    });

    it('handles action as array', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      await controller.getHistory(
        '1',
        '10',
        ['CREATE', 'UPDATE'],
        'role',
        'user',
      );
      expect(getList.execute).toHaveBeenCalledWith(1, 10, {
        action: ['CREATE', 'UPDATE'],
        entity: 'role',
        userId: 'user',
      });
    });

    it('handles comma-separated action string', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      await controller.getHistory(
        '1',
        '10',
        'CREATE,UPDATE,DELETE',
        'role',
        'user',
      );
      expect(getList.execute).toHaveBeenCalledWith(1, 10, {
        action: ['CREATE', 'UPDATE', 'DELETE'],
        entity: 'role',
        userId: 'user',
      });
    });

    it('handles comma-separated action string with spaces', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      await controller.getHistory(
        '1',
        '10',
        'CREATE, UPDATE, DELETE',
        'role',
        'user',
      );
      expect(getList.execute).toHaveBeenCalledWith(1, 10, {
        action: ['CREATE', 'UPDATE', 'DELETE'],
        entity: 'role',
        userId: 'user',
      });
    });

    it('handles sort and order parameters', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      await controller.getHistory(
        '1',
        '10',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'createdAt',
        'desc',
      );
      expect(getList.execute).toHaveBeenCalledWith(1, 10, {
        sort: 'createdAt',
        order: 'desc',
      });
    });

    it('handles ascending order', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      await controller.getHistory(
        '1',
        '10',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'entity',
        'asc',
      );
      expect(getList.execute).toHaveBeenCalledWith(1, 10, {
        sort: 'entity',
        order: 'asc',
      });
    });

    it('returns history events with all metadata fields', async () => {
      const event = new HistoryEvent();
      event.id = 'event-123';
      event.entity = 'server';
      event.entityId = 'server-456';
      event.action = 'UPDATE';
      event.userId = 'user-789';
      event.createdAt = new Date('2024-01-01T00:00:00Z');
      event.oldValue = { status: 'running' };
      event.newValue = { status: 'stopped' };
      event.metadata = { reason: 'maintenance' };
      event.ipAddress = '192.168.1.100';
      event.userAgent = 'Mozilla/5.0';
      event.correlationId = 'corr-123';

      const eventDto = new HistoryEventResponseDto(event);
      const mockResponse = new HistoryListResponseDto([eventDto], 1, 1, 10);

      getList.execute.mockResolvedValue(mockResponse);
      const result = await controller.getHistory('1', '10');

      expect(result.items[0].ipAddress).toBe('192.168.1.100');
      expect(result.items[0].userAgent).toBe('Mozilla/5.0');
      expect(result.items[0].correlationId).toBe('corr-123');
      expect(result.items[0].metadata).toEqual({ reason: 'maintenance' });
      expect(result.items[0].oldValue).toEqual({ status: 'running' });
      expect(result.items[0].newValue).toEqual({ status: 'stopped' });
    });

    it('handles empty action string', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      await controller.getHistory('1', '10', '');
      expect(getList.execute).toHaveBeenCalledWith(1, 10, {});
    });

    it('handles only spaces in action string', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      await controller.getHistory('1', '10', '   ');
      expect(getList.execute).toHaveBeenCalledWith(1, 10, {
        action: '   ',
      });
    });

    it('handles all parameters combined', async () => {
      const mock = { items: [] } as any;
      getList.execute.mockResolvedValue(mock);
      await controller.getHistory(
        '3',
        '50',
        'CREATE,UPDATE',
        'vm',
        'user-123',
        '2024-01-01',
        '2024-12-31',
        'action',
        'desc',
      );
      expect(getList.execute).toHaveBeenCalledWith(3, 50, {
        action: ['CREATE', 'UPDATE'],
        entity: 'vm',
        userId: 'user-123',
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31'),
        sort: 'action',
        order: 'desc',
      });
    });
  });

  describe('getEntityTypes', () => {
    it('should return EntityTypesResponseDto from use case', async () => {
      const mockDto = new EntityTypesResponseDto([
        'Server',
        'VM',
        'User',
        'Group',
      ]);
      getEntityTypesUseCase.execute.mockResolvedValue(mockDto);

      const result = await controller.getEntityTypes();

      expect(getEntityTypesUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getEntityTypesUseCase.execute).toHaveBeenCalledWith();
      expect(result).toBeInstanceOf(EntityTypesResponseDto);
      expect(result.entityTypes).toEqual(['Server', 'VM', 'User', 'Group']);
      expect(result).toBe(mockDto);
    });

    it('should return EntityTypesResponseDto with empty array when no entity types exist', async () => {
      const mockDto = new EntityTypesResponseDto([]);
      getEntityTypesUseCase.execute.mockResolvedValue(mockDto);

      const result = await controller.getEntityTypes();

      expect(getEntityTypesUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(EntityTypesResponseDto);
      expect(result.entityTypes).toEqual([]);
      expect(result).toBe(mockDto);
    });

    it('should handle errors from use case', async () => {
      const mockError = new Error('Database error');
      getEntityTypesUseCase.execute.mockRejectedValue(mockError);

      await expect(controller.getEntityTypes()).rejects.toThrow(
        'Database error',
      );
      expect(getEntityTypesUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should pass through the exact DTO instance from use case', async () => {
      const mockDto = new EntityTypesResponseDto(['Server', 'VM']);
      getEntityTypesUseCase.execute.mockResolvedValue(mockDto);

      const result = await controller.getEntityTypes();

      expect(result).toBe(mockDto);
      expect(result.entityTypes).toEqual(['Server', 'VM']);
    });
  });

  describe('getActionTypes', () => {
    it('should return ActionTypesResponseDto from use case', async () => {
      const mockDto: ActionTypesResponseDto = {
        create: ['CREATE', 'REGISTER'],
        update: ['UPDATE', 'ROLE_ASSIGNED'],
        delete: ['DELETE'],
        auth: ['LOGIN', 'LOGOUT', '2FA_ENABLE'],
        server: ['START', 'RESTART', 'SHUTDOWN'],
      };
      getHistoryActionTypesUseCase.execute.mockResolvedValue(mockDto);

      const result = await controller.getActionTypes();

      expect(getHistoryActionTypesUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getHistoryActionTypesUseCase.execute).toHaveBeenCalledWith();
      expect(result).toBe(mockDto);
      expect(result.create).toEqual(['CREATE', 'REGISTER']);
      expect(result.auth).toEqual(['LOGIN', 'LOGOUT', '2FA_ENABLE']);
      expect(result.server).toEqual(['START', 'RESTART', 'SHUTDOWN']);
    });

    it('should handle empty action types', async () => {
      const mockDto: ActionTypesResponseDto = {
        create: [],
        update: [],
        delete: [],
        auth: [],
        server: [],
      };
      getHistoryActionTypesUseCase.execute.mockResolvedValue(mockDto);

      const result = await controller.getActionTypes();

      expect(result).toBe(mockDto);
      expect(result.create).toEqual([]);
      expect(result.auth).toEqual([]);
      expect(result.server).toEqual([]);
    });

    it('should handle partial categories', async () => {
      const mockDto: ActionTypesResponseDto = {
        create: ['CREATE'],
        update: [],
        delete: [],
        auth: [],
        server: ['START', 'RESTART', 'SHUTDOWN'],
      };
      getHistoryActionTypesUseCase.execute.mockResolvedValue(mockDto);

      const result = await controller.getActionTypes();

      expect(result).toBe(mockDto);
      expect(result.create).toEqual(['CREATE']);
      expect(result.auth).toEqual([]);
      expect(result.server).toEqual(['START', 'RESTART', 'SHUTDOWN']);
    });

    it('should handle errors from use case', async () => {
      const mockError = new Error('Service unavailable');
      getHistoryActionTypesUseCase.execute.mockRejectedValue(mockError);

      await expect(controller.getActionTypes()).rejects.toThrow(
        'Service unavailable',
      );
      expect(getHistoryActionTypesUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStats', () => {
    it('should return HistoryStatsResponseDto from use case', async () => {
      const mockDto: HistoryStatsResponseDto = {
        totalEvents: 1000,
        eventsByEntity: {
          server: 300,
          vm: 400,
          user: 200,
          role: 100,
        },
        eventsByAction: {
          CREATE: 250,
          UPDATE: 500,
          DELETE: 150,
          LOGIN: 100,
        },
        activityTrends: [
          { date: '2024-01-01', count: 50 },
          { date: '2024-01-02', count: 75 },
        ],
        topUsers: [
          { userId: 'user-1', username: 'admin', count: 100 },
          { userId: 'user-2', username: 'operator', count: 50 },
        ],
      };
      getHistoryStatisticsUseCase.execute.mockResolvedValue(mockDto);

      const result = await controller.getStats();

      expect(getHistoryStatisticsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getHistoryStatisticsUseCase.execute).toHaveBeenCalledWith();
      expect(result).toBe(mockDto);
      expect(result.totalEvents).toBe(1000);
      expect(result.eventsByEntity.server).toBe(300);
      expect(result.eventsByAction.UPDATE).toBe(500);
      expect(result.activityTrends[0].count).toBe(50);
      expect(result.topUsers[0].username).toBe('admin');
    });

    it('should handle empty statistics', async () => {
      const mockDto: HistoryStatsResponseDto = {
        totalEvents: 0,
        eventsByEntity: {},
        eventsByAction: {},
        activityTrends: [],
        topUsers: [],
      };
      getHistoryStatisticsUseCase.execute.mockResolvedValue(mockDto);

      const result = await controller.getStats();

      expect(result).toBe(mockDto);
      expect(result.totalEvents).toBe(0);
      expect(result.eventsByEntity).toEqual({});
      expect(result.eventsByAction).toEqual({});
      expect(result.activityTrends).toEqual([]);
      expect(result.topUsers).toEqual([]);
    });

    it('should handle large numbers in statistics', async () => {
      const mockDto: HistoryStatsResponseDto = {
        totalEvents: 999999999,
        eventsByEntity: {
          server: 300000000,
          vm: 400000000,
          user: 299999999,
        },
        eventsByAction: {
          CREATE: 999999999,
        },
        activityTrends: [
          { date: '2024-01-01', count: 999999999 },
        ],
        topUsers: [
          { userId: 'user-1', username: 'superuser', count: 999999999 },
        ],
      };
      getHistoryStatisticsUseCase.execute.mockResolvedValue(mockDto);

      const result = await controller.getStats();

      expect(result).toBe(mockDto);
      expect(result.totalEvents).toBe(999999999);
      expect(result.eventsByEntity.server).toBe(300000000);
      expect(result.activityTrends[0].count).toBe(999999999);
      expect(result.topUsers[0].count).toBe(999999999);
    });

    it('should handle errors from use case', async () => {
      const mockError = new Error('Statistics calculation failed');
      getHistoryStatisticsUseCase.execute.mockRejectedValue(mockError);

      await expect(controller.getStats()).rejects.toThrow(
        'Statistics calculation failed',
      );
      expect(getHistoryStatisticsUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});