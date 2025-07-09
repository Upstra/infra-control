import { Test, TestingModule } from '@nestjs/testing';
import { ServerController } from '../server.controller';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { ServerUpdateDto } from '../../dto/server.update.dto';
import {
  GetAllServersUseCase,
  GetServerByIdUseCase,
  CreateServerUseCase,
  UpdateServerUseCase,
  DeleteServerUseCase,
  GetServerByIdWithPermissionCheckUseCase,
  GetUserServersUseCase,
  UpdateServerPriorityUseCase,
  CheckServerPermissionUseCase,
} from '../../use-cases';
import { Reflector } from '@nestjs/core';
import { GetUserWithRoleUseCase } from '@/modules/users/application/use-cases/get-user-with-role.use-case';

describe('ServerController - Admin Bypass Tests', () => {
  let controller: ServerController;
  let updateServerUseCase: jest.Mocked<UpdateServerUseCase>;
  let deleteServerUseCase: jest.Mocked<DeleteServerUseCase>;
  let updateServerPriorityUseCase: jest.Mocked<UpdateServerPriorityUseCase>;

  const mockAdminUser: JwtPayload = {
    userId: 'admin-123',
    email: 'admin@example.com',
  };

  const _mockNormalUser: JwtPayload = {
    userId: 'user-123',
    email: 'user@example.com',
  };

  beforeEach(async () => {
    updateServerUseCase = {
      execute: jest.fn(),
    } as any;

    deleteServerUseCase = {
      execute: jest.fn(),
    } as any;

    updateServerPriorityUseCase = {
      execute: jest.fn(),
    } as any;

    const mockReflector = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    };

    const mockUserRepository = {
      findOneByField: jest.fn().mockResolvedValue({
        id: 'admin-123',
        roles: [{ id: 'role-1', name: 'admin', isAdmin: true }],
      }),
    };

    const mockPermissionStrategyFactory = {
      getStrategy: jest.fn().mockReturnValue({
        checkPermission: jest.fn().mockResolvedValue(true),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerController],
      providers: [
        {
          provide: UpdateServerUseCase,
          useValue: updateServerUseCase,
        },
        {
          provide: DeleteServerUseCase,
          useValue: deleteServerUseCase,
        },
        {
          provide: UpdateServerPriorityUseCase,
          useValue: updateServerPriorityUseCase,
        },
        {
          provide: GetAllServersUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetServerByIdUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CreateServerUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserServersUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetServerByIdWithPermissionCheckUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: 'UserRepositoryInterface',
          useValue: mockUserRepository,
        },
        {
          provide: 'PermissionStrategyFactory',
          useValue: mockPermissionStrategyFactory,
        },
        {
          provide: CheckServerPermissionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserWithRoleUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ResourcePermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ServerController>(ServerController);
  });

  describe('Admin bypass for server operations', () => {
    describe('PATCH /server/:id', () => {
      const serverDto: ServerUpdateDto = {
        name: 'Updated Server',
      };

      it('should allow update when guard permits', async () => {
        updateServerUseCase.execute.mockResolvedValue({
          id: 'server-123',
          name: 'Updated Server',
        } as any);

        const result = await controller.updateServer(
          'server-123',
          serverDto,
          mockAdminUser,
        );

        expect(updateServerUseCase.execute).toHaveBeenCalledWith(
          'server-123',
          serverDto,
          'admin-123',
        );
        expect(result.name).toBe('Updated Server');
      });
    });

    describe('DELETE /server/:id', () => {
      it('should allow delete when guard permits', async () => {
        await controller.deleteServer('server-123', mockAdminUser);

        expect(deleteServerUseCase.execute).toHaveBeenCalledWith(
          'server-123',
          'admin-123',
        );
      });
    });

    describe('PUT /server/:id/priority', () => {
      it('should allow priority update when guard permits', async () => {
        updateServerPriorityUseCase.execute.mockResolvedValue({
          id: 'server-123',
          priority: 5,
        });

        const result = await controller.updatePriority(
          'server-123',
          { priority: 5 },
          mockAdminUser,
        );

        expect(updateServerPriorityUseCase.execute).toHaveBeenCalledWith(
          'server-123',
          5,
          'admin-123',
        );
        expect(result.priority).toBe(5);
      });
    });
  });
});
