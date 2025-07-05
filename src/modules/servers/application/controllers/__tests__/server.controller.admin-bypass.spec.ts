import { Test, TestingModule } from '@nestjs/testing';
import { ServerController } from '../server.controller';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { UserTypeormRepository } from '@/modules/users/infrastructure/repositories/user.typeorm.repository';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ServerUpdateDto } from '../../dto/server.update.dto';
import {
  UpdateServerUseCase,
  DeleteServerUseCase,
  UpdateServerPriorityUseCase,
} from '../../use-cases';

describe('ServerController - Admin Bypass Tests', () => {
  let controller: ServerController;
  let userRepository: jest.Mocked<UserTypeormRepository>;
  let updateServerUseCase: jest.Mocked<UpdateServerUseCase>;
  let deleteServerUseCase: jest.Mocked<DeleteServerUseCase>;
  let updateServerPriorityUseCase: jest.Mocked<UpdateServerPriorityUseCase>;
  let resourcePermissionGuard: ResourcePermissionGuard;
  let mockStrategy: any;

  const mockAdminUser: JwtPayload = {
    userId: 'admin-123',
    email: 'admin@example.com',
  };

  const mockNormalUser: JwtPayload = {
    userId: 'user-123',
    email: 'user@example.com',
  };

  const createMockUser = (isAdmin: boolean): User => {
    const role = new Role();
    role.id = 'role-1';
    role.name = isAdmin ? 'admin' : 'user';
    role.isAdmin = isAdmin;

    const user = new User();
    user.id = isAdmin ? 'admin-123' : 'user-123';
    user.email = isAdmin ? 'admin@example.com' : 'user@example.com';
    user.roles = [role];
    return user;
  };

  beforeEach(async () => {
    mockStrategy = {
      checkPermission: jest.fn(),
    };

    const mockStrategyFactory = {
      getStrategy: jest.fn().mockReturnValue(mockStrategy),
    };

    userRepository = {
      findOneByField: jest.fn(),
    } as any;

    updateServerUseCase = {
      execute: jest.fn(),
    } as any;

    deleteServerUseCase = {
      execute: jest.fn(),
    } as any;

    updateServerPriorityUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerController],
      providers: [
        {
          provide: 'UserRepositoryInterface',
          useValue: userRepository,
        },
        {
          provide: 'PermissionStrategyFactory',
          useValue: mockStrategyFactory,
        },
        {
          provide: 'UpdateServerUseCase',
          useValue: updateServerUseCase,
        },
        {
          provide: 'DeleteServerUseCase',
          useValue: deleteServerUseCase,
        },
        {
          provide: 'UpdateServerPriorityUseCase',
          useValue: updateServerPriorityUseCase,
        },
        {
          provide: 'GetAllServersUseCase',
          useValue: { execute: jest.fn() },
        },
        {
          provide: 'GetServerByIdUseCase',
          useValue: { execute: jest.fn() },
        },
        {
          provide: 'CreateServerUseCase',
          useValue: { execute: jest.fn() },
        },
        {
          provide: 'GetUserServersUseCase',
          useValue: { execute: jest.fn() },
        },
        {
          provide: 'GetServerByIdWithPermissionCheckUseCase',
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ServerController>(ServerController);
    resourcePermissionGuard = module.get<ResourcePermissionGuard>(
      ResourcePermissionGuard,
    );
  });

  describe('Admin bypass for server operations', () => {
    describe('PATCH /server/:id', () => {
      const serverDto: ServerUpdateDto = {
        name: 'Updated Server',
      };

      it('should allow admin to update server without specific permissions', async () => {
        const adminUser = createMockUser(true);
        userRepository.findOneByField.mockResolvedValue(adminUser);
        mockStrategy.checkPermission.mockResolvedValue(false);
        updateServerUseCase.execute.mockResolvedValue({
          id: 'server-123',
          name: 'Updated Server',
        } as any);

        const result = await controller.updateServer(
          'server-123',
          serverDto,
          mockAdminUser,
        );

        expect(userRepository.findOneByField).toHaveBeenCalledWith({
          field: 'id',
          value: 'admin-123',
          relations: ['roles'],
        });
        expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
        expect(updateServerUseCase.execute).toHaveBeenCalledWith(
          'server-123',
          serverDto,
          'admin-123',
        );
        expect(result.name).toBe('Updated Server');
      });

      it('should check permissions for non-admin users', async () => {
        const normalUser = createMockUser(false);
        userRepository.findOneByField.mockResolvedValue(normalUser);
        mockStrategy.checkPermission.mockResolvedValue(true);
        updateServerUseCase.execute.mockResolvedValue({
          id: 'server-123',
          name: 'Updated Server',
        } as any);

        const result = await controller.updateServer(
          'server-123',
          serverDto,
          mockNormalUser,
        );

        expect(userRepository.findOneByField).toHaveBeenCalledWith({
          field: 'id',
          value: 'user-123',
          relations: ['roles'],
        });
        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'server-123',
          PermissionBit.WRITE,
        );
        expect(result.name).toBe('Updated Server');
      });
    });

    describe('DELETE /server/:id', () => {
      it('should allow admin to delete server without specific permissions', async () => {
        const adminUser = createMockUser(true);
        userRepository.findOneByField.mockResolvedValue(adminUser);
        mockStrategy.checkPermission.mockResolvedValue(false);

        await controller.deleteServer('server-123');

        expect(userRepository.findOneByField).toHaveBeenCalled();
        expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
        expect(deleteServerUseCase.execute).toHaveBeenCalledWith('server-123');
      });

      it('should check permissions for non-admin users', async () => {
        const normalUser = createMockUser(false);
        userRepository.findOneByField.mockResolvedValue(normalUser);
        mockStrategy.checkPermission.mockResolvedValue(true);

        await controller.deleteServer('server-123');

        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'server-123',
          PermissionBit.DELETE,
        );
        expect(deleteServerUseCase.execute).toHaveBeenCalledWith('server-123');
      });
    });

    describe('PUT /server/:id/priority', () => {
      it('should allow admin to update priority without specific permissions', async () => {
        const adminUser = createMockUser(true);
        userRepository.findOneByField.mockResolvedValue(adminUser);
        mockStrategy.checkPermission.mockResolvedValue(false);
        updateServerPriorityUseCase.execute.mockResolvedValue({
          id: 'server-123',
          priority: 5,
        });

        const result = await controller.updatePriority(
          'server-123',
          { priority: 5 },
          mockAdminUser,
        );

        expect(userRepository.findOneByField).toHaveBeenCalled();
        expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
        expect(updateServerPriorityUseCase.execute).toHaveBeenCalledWith(
          'server-123',
          5,
          'admin-123',
        );
        expect(result.priority).toBe(5);
      });
    });
  });

  describe('Admin with multiple roles', () => {
    it('should bypass permissions when user has admin role among multiple roles', async () => {
      const multiRoleUser = new User();
      multiRoleUser.id = 'admin-123';
      multiRoleUser.roles = [
        Object.assign(new Role(), {
          id: 'role-1',
          name: 'user',
          isAdmin: false,
        }),
        Object.assign(new Role(), {
          id: 'role-2',
          name: 'admin',
          isAdmin: true,
        }),
        Object.assign(new Role(), {
          id: 'role-3',
          name: 'moderator',
          isAdmin: false,
        }),
      ];

      userRepository.findOneByField.mockResolvedValue(multiRoleUser);
      mockStrategy.checkPermission.mockResolvedValue(false);

      await controller.deleteServer('server-123');

      expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
      expect(deleteServerUseCase.execute).toHaveBeenCalledWith('server-123');
    });
  });
});
