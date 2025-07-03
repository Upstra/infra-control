import { Test, TestingModule } from '@nestjs/testing';
import { GroupShutdownController } from '../group.shutdown.controller';
import { PreviewShutdownUseCase } from '../../use-cases/preview-shutdown.use-case';
import { ExecuteShutdownUseCase } from '../../use-cases/execute-shutdown.use-case';
import { ShutdownRequestDto } from '../../dto/shutdown-request.dto';
import { ShutdownPreviewListResponseDto } from '../../dto/shutdown-preview.list.response.dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';

describe('GroupShutdownController', () => {
  let controller: GroupShutdownController;
  let previewShutdownUseCase: jest.Mocked<PreviewShutdownUseCase>;
  let executeShutdownUseCase: jest.Mocked<ExecuteShutdownUseCase>;

  beforeEach(async () => {
    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockRoleGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupShutdownController],
      providers: [
        {
          provide: PreviewShutdownUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ExecuteShutdownUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get<GroupShutdownController>(GroupShutdownController);
    previewShutdownUseCase = module.get(PreviewShutdownUseCase);
    executeShutdownUseCase = module.get(ExecuteShutdownUseCase);
  });

  describe('preview', () => {
    it('should preview shutdown sequence', async () => {
      const dto: ShutdownRequestDto = {
        groupIds: ['group-1', 'group-2'],
      };

      const expectedResponse: ShutdownPreviewListResponseDto = {
        items: [
          {
            order: 1,
            type: 'vm',
            entityId: 'vm-1',
            entityName: 'VM 1',
            groupId: 'group-1',
            groupName: 'VM Group',
            priority: 1,
          },
          {
            order: 2,
            type: 'server',
            entityId: 'server-1',
            entityName: 'Server 1',
            groupId: 'group-2',
            groupName: 'Server Group',
            priority: 2,
          },
        ],
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
        totalVms: 1,
        totalServers: 1,
      };

      previewShutdownUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.preview(dto);

      expect(previewShutdownUseCase.execute).toHaveBeenCalledWith([
        'group-1',
        'group-2',
      ], 1, 10);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle empty group IDs', async () => {
      const dto: ShutdownRequestDto = {
        groupIds: [],
      };

      const expectedResponse: ShutdownPreviewListResponseDto =
        new ShutdownPreviewListResponseDto([], 0, 1, 10, 0, 0);

      previewShutdownUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.preview(dto);

      expect(previewShutdownUseCase.execute).toHaveBeenCalledWith([], 1, 10);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('execute', () => {
    it('should execute shutdown sequence', async () => {
      const dto: ShutdownRequestDto = {
        groupIds: ['group-1', 'group-2'],
      };

      const user: JwtPayload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const expectedResponse: ShutdownPreviewListResponseDto = {
        items: [
          {
            order: 1,
            type: 'server',
            entityId: 'server-1',
            entityName: 'Server 1',
            groupId: 'group-1',
            groupName: 'Server Group',
            priority: 1,
          },
        ],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        totalVms: 0,
        totalServers: 1,
      };

      executeShutdownUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.execute(dto, user);

      expect(executeShutdownUseCase.execute).toHaveBeenCalledWith(
        ['group-1', 'group-2'],
        'user-123',
        1,
        10,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should pass user ID to execute use case', async () => {
      const dto: ShutdownRequestDto = {
        groupIds: ['group-1'],
      };

      const user: JwtPayload = {
        userId: 'different-user',
        email: 'other@example.com',
      };

      executeShutdownUseCase.execute.mockResolvedValue(
        new ShutdownPreviewListResponseDto([], 0, 1, 10, 0, 0),
      );

      await controller.execute(dto, user);

      expect(executeShutdownUseCase.execute).toHaveBeenCalledWith(
        ['group-1'],
        'different-user',
        1,
        10,
      );
    });
  });
});
