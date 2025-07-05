import { Test, TestingModule } from '@nestjs/testing';
import { GroupShutdownController } from '../group-shutdown.controller';
import { PreviewGroupShutdownUseCase } from '../../use-cases/preview-group-shutdown.use-case';
import { ExecuteGroupShutdownUseCase } from '../../use-cases/execute-group-shutdown.use-case';
import { GroupShutdownDto } from '../../dto/group-shutdown.dto';
import { PreviewShutdownResponseDto } from '../../dto/preview-shutdown-response.dto';
import { GroupType } from '../../../domain/enums/group-type.enum';

describe('GroupShutdownController', () => {
  let controller: GroupShutdownController;
  let previewGroupShutdownUseCase: jest.Mocked<PreviewGroupShutdownUseCase>;
  let executeGroupShutdownUseCase: jest.Mocked<ExecuteGroupShutdownUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupShutdownController],
      providers: [
        {
          provide: PreviewGroupShutdownUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ExecuteGroupShutdownUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GroupShutdownController>(GroupShutdownController);
    previewGroupShutdownUseCase = module.get(PreviewGroupShutdownUseCase);
    executeGroupShutdownUseCase = module.get(ExecuteGroupShutdownUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('previewShutdown', () => {
    it('should return shutdown preview for a group', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPreview: PreviewShutdownResponseDto = {
        groupId,
        groupName: 'Test Group',
        groupType: GroupType.VM,
        totalResources: 3,
        estimatedDuration: 90,
        resources: [
          {
            id: 'vm-1',
            name: 'VM 1',
            priority: 1,
            state: 'running',
            shutdownOrder: 1,
          },
          {
            id: 'vm-2',
            name: 'VM 2',
            priority: 2,
            state: 'running',
            shutdownOrder: 2,
          },
          {
            id: 'vm-3',
            name: 'VM 3',
            priority: 3,
            state: 'stopped',
            shutdownOrder: 3,
          },
        ],
      };

      previewGroupShutdownUseCase.execute.mockResolvedValue(mockPreview);

      const result = await controller.previewShutdown(groupId);

      expect(previewGroupShutdownUseCase.execute).toHaveBeenCalledWith(groupId);
      expect(result).toEqual(mockPreview);
    });

    it('should handle empty group preview', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPreview: PreviewShutdownResponseDto = {
        groupId,
        groupName: 'Empty Group',
        groupType: GroupType.SERVER,
        totalResources: 0,
        estimatedDuration: 0,
        resources: [],
      };

      previewGroupShutdownUseCase.execute.mockResolvedValue(mockPreview);

      const result = await controller.previewShutdown(groupId);

      expect(previewGroupShutdownUseCase.execute).toHaveBeenCalledWith(groupId);
      expect(result.totalResources).toBe(0);
      expect(result.resources).toHaveLength(0);
    });

    it('should handle preview for server groups', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPreview: PreviewShutdownResponseDto = {
        groupId,
        groupName: 'Server Group',
        groupType: GroupType.SERVER,
        totalResources: 2,
        estimatedDuration: 60,
        resources: [
          {
            id: 'server-1',
            name: 'Server 1',
            priority: 1,
            state: 'running',
            shutdownOrder: 1,
          },
          {
            id: 'server-2',
            name: 'Server 2',
            priority: 2,
            state: 'running',
            shutdownOrder: 2,
          },
        ],
      };

      previewGroupShutdownUseCase.execute.mockResolvedValue(mockPreview);

      const result = await controller.previewShutdown(groupId);

      expect(result.groupType).toBe(GroupType.SERVER);
      expect(result.resources).toHaveLength(2);
    });

    it('should propagate errors from use case', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new Error('Preview failed');

      previewGroupShutdownUseCase.execute.mockRejectedValue(error);

      await expect(controller.previewShutdown(groupId)).rejects.toThrow(error);
    });
  });

  describe('executeShutdown', () => {
    it('should execute shutdown with default parameters', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: GroupShutdownDto = {};
      const user = { id: 'user-123' };

      executeGroupShutdownUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.executeShutdown(groupId, dto, user);

      expect(executeGroupShutdownUseCase.execute).toHaveBeenCalledWith(
        groupId,
        dto,
        user.id,
      );
      expect(result).toBeUndefined();
    });

    it('should execute shutdown with custom grace period', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: GroupShutdownDto = { gracePeriod: 600 };
      const user = { id: 'user-456' };

      executeGroupShutdownUseCase.execute.mockResolvedValue(undefined);

      await controller.executeShutdown(groupId, dto, user);

      expect(executeGroupShutdownUseCase.execute).toHaveBeenCalledWith(
        groupId,
        { gracePeriod: 600 },
        user.id,
      );
    });

    it('should execute forced shutdown', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: GroupShutdownDto = { force: true, gracePeriod: 0 };
      const user = { id: 'user-789' };

      executeGroupShutdownUseCase.execute.mockResolvedValue(undefined);

      await controller.executeShutdown(groupId, dto, user);

      expect(executeGroupShutdownUseCase.execute).toHaveBeenCalledWith(
        groupId,
        { force: true, gracePeriod: 0 },
        user.id,
      );
    });

    it('should handle all shutdown parameters', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: GroupShutdownDto = {
        gracePeriod: 300,
        force: false,
      };
      const user = { id: 'user-999' };

      executeGroupShutdownUseCase.execute.mockResolvedValue(undefined);

      await controller.executeShutdown(groupId, dto, user);

      expect(executeGroupShutdownUseCase.execute).toHaveBeenCalledWith(
        groupId,
        dto,
        user.id,
      );
    });

    it('should propagate errors from use case', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: GroupShutdownDto = {};
      const user = { id: 'user-123' };
      const error = new Error('Shutdown failed');

      executeGroupShutdownUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.executeShutdown(groupId, dto, user),
      ).rejects.toThrow(error);
    });

    it('should handle multiple shutdown requests', async () => {
      const groupId1 = '123e4567-e89b-12d3-a456-426614174001';
      const groupId2 = '123e4567-e89b-12d3-a456-426614174002';
      const dto: GroupShutdownDto = {};
      const user = { id: 'user-123' };

      executeGroupShutdownUseCase.execute.mockResolvedValue(undefined);

      await controller.executeShutdown(groupId1, dto, user);
      await controller.executeShutdown(groupId2, dto, user);

      expect(executeGroupShutdownUseCase.execute).toHaveBeenCalledTimes(2);
      expect(executeGroupShutdownUseCase.execute).toHaveBeenNthCalledWith(
        1,
        groupId1,
        dto,
        user.id,
      );
      expect(executeGroupShutdownUseCase.execute).toHaveBeenNthCalledWith(
        2,
        groupId2,
        dto,
        user.id,
      );
    });
  });

  describe('controller integration', () => {
    it('should handle preview followed by execute', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const user = { id: 'user-123' };

      const mockPreview: PreviewShutdownResponseDto = {
        groupId,
        groupName: 'Test Group',
        groupType: GroupType.VM,
        totalResources: 2,
        estimatedDuration: 60,
        resources: [
          {
            id: 'vm-1',
            name: 'VM 1',
            priority: 1,
            state: 'running',
            shutdownOrder: 1,
          },
          {
            id: 'vm-2',
            name: 'VM 2',
            priority: 2,
            state: 'running',
            shutdownOrder: 2,
          },
        ],
      };

      previewGroupShutdownUseCase.execute.mockResolvedValue(mockPreview);
      executeGroupShutdownUseCase.execute.mockResolvedValue(undefined);

      const previewResult = await controller.previewShutdown(groupId);
      expect(previewResult).toEqual(mockPreview);

      const dto: GroupShutdownDto = { gracePeriod: 300 };
      await controller.executeShutdown(groupId, dto, user);

      expect(previewGroupShutdownUseCase.execute).toHaveBeenCalledWith(groupId);
      expect(executeGroupShutdownUseCase.execute).toHaveBeenCalledWith(
        groupId,
        dto,
        user.id,
      );
    });
  });
});
