import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from '../history.controller';
import { GetHistoryListUseCase } from '../../use-cases/get-history-list.use-case';
import { GetHistoryEntityTypesUseCase } from '../../use-cases/get-entity-types.use-case';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { EntityTypesResponseDto } from '../../dto/entity-types.response.dto';
import { HistoryEventResponseDto } from '../../dto/history-event.response.dto';
import { HistoryListResponseDto } from '../../dto/history.list.response.dto';
import { HistoryEvent } from '../../../domain/entities/history-event.entity';

describe('HistoryController', () => {
  let controller: HistoryController;
  let getList: jest.Mocked<GetHistoryListUseCase>;
  let getEntityTypesUseCase: jest.Mocked<GetHistoryEntityTypesUseCase>;

  beforeEach(async () => {
    getList = { execute: jest.fn() } as any;
    getEntityTypesUseCase = { execute: jest.fn() } as any;
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
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get(HistoryController);
  });

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
    expect(getList.execute).toHaveBeenCalledWith(1, 10, {});
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
});
