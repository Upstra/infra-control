import { Test, TestingModule } from '@nestjs/testing';
import { VmController } from '../vm.controller';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { UserTypeormRepository } from '@/modules/users/infrastructure/repositories/user.typeorm.repository';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { VmUpdateDto } from '../../dto/vm.update.dto';
import { VmCreationDto } from '../../dto/vm.creation.dto';
import {
  UpdateVmUseCase,
  DeleteVmUseCase,
  UpdateVmPriorityUseCase,
  CreateVmUseCase,
  GetAllVmsUseCase,
  GetVmListUseCase,
  GetVmByIdUseCase,
} from '../../use-cases';
import { RequestContextDto } from '@/core/dto';

describe('VmController - Admin Bypass Tests', () => {
  let controller: VmController;
  let userRepository: jest.Mocked<UserTypeormRepository>;
  let updateVmUseCase: jest.Mocked<UpdateVmUseCase>;
  let deleteVmUseCase: jest.Mocked<DeleteVmUseCase>;
  let updateVmPriorityUseCase: jest.Mocked<UpdateVmPriorityUseCase>;
  let createVmUseCase: jest.Mocked<CreateVmUseCase>;
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

  const mockRequest = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
    },
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

    updateVmUseCase = {
      execute: jest.fn(),
    } as any;

    deleteVmUseCase = {
      execute: jest.fn(),
    } as any;

    updateVmPriorityUseCase = {
      execute: jest.fn(),
    } as any;

    createVmUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VmController],
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
          provide: UpdateVmUseCase,
          useValue: updateVmUseCase,
        },
        {
          provide: DeleteVmUseCase,
          useValue: deleteVmUseCase,
        },
        {
          provide: UpdateVmPriorityUseCase,
          useValue: updateVmPriorityUseCase,
        },
        {
          provide: CreateVmUseCase,
          useValue: createVmUseCase,
        },
        {
          provide: GetAllVmsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetVmListUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetVmByIdUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<VmController>(VmController);
    resourcePermissionGuard = module.get<ResourcePermissionGuard>(
      ResourcePermissionGuard,
    );
  });

  describe('Admin bypass for VM operations', () => {
    describe('POST /vm', () => {
      const vmDto: VmCreationDto = {
        name: 'Test VM',
        serverId: 'server-123',
        priority: 1,
        state: 'running',
        grace_period_on: 60,
        grace_period_off: 30,
        os: 'Ubuntu 22.04',
        adminUrl: 'https://admin.example.com',
        ip: '192.168.1.100',
        login: 'admin',
        password: 'securePassword123',
      };

      it('should allow admin to create VM without server WRITE permission', async () => {
        const adminUser = createMockUser(true);
        userRepository.findOneByField.mockResolvedValue(adminUser);
        mockStrategy.checkPermission.mockResolvedValue(false);
        createVmUseCase.execute.mockResolvedValue({
          id: 'vm-123',
          name: 'Test VM',
        } as any);

        const result = await controller.createVm(
          vmDto,
          mockAdminUser,
          mockRequest,
        );

        expect(userRepository.findOneByField).toHaveBeenCalledWith({
          field: 'id',
          value: 'admin-123',
          relations: ['roles'],
        });
        expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
        expect(createVmUseCase.execute).toHaveBeenCalledWith(
          vmDto,
          'admin-123',
          expect.any(RequestContextDto),
        );
        expect(result.name).toBe('Test VM');
      });

      it('should check server permissions for non-admin users', async () => {
        const normalUser = createMockUser(false);
        userRepository.findOneByField.mockResolvedValue(normalUser);
        mockStrategy.checkPermission.mockResolvedValue(true);
        createVmUseCase.execute.mockResolvedValue({
          id: 'vm-123',
          name: 'Test VM',
        } as any);

        const result = await controller.createVm(
          vmDto,
          mockNormalUser,
          mockRequest,
        );

        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'server-123',
          PermissionBit.WRITE,
        );
        expect(result.name).toBe('Test VM');
      });
    });

    describe('PATCH /vm/:id', () => {
      const vmDto: VmUpdateDto = {
        name: 'Updated VM',
      };

      it('should allow admin to update VM without specific permissions', async () => {
        const adminUser = createMockUser(true);
        userRepository.findOneByField.mockResolvedValue(adminUser);
        mockStrategy.checkPermission.mockResolvedValue(false);
        updateVmUseCase.execute.mockResolvedValue({
          id: 'vm-123',
          name: 'Updated VM',
        } as any);

        const result = await controller.updateVm('vm-123', vmDto);

        expect(userRepository.findOneByField).toHaveBeenCalled();
        expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
        expect(updateVmUseCase.execute).toHaveBeenCalledWith('vm-123', vmDto);
        expect(result.name).toBe('Updated VM');
      });

      it('should check permissions for non-admin users', async () => {
        const normalUser = createMockUser(false);
        userRepository.findOneByField.mockResolvedValue(normalUser);
        mockStrategy.checkPermission.mockResolvedValue(true);
        updateVmUseCase.execute.mockResolvedValue({
          id: 'vm-123',
          name: 'Updated VM',
        } as any);

        const result = await controller.updateVm('vm-123', vmDto);

        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'vm-123',
          PermissionBit.WRITE,
        );
        expect(result.name).toBe('Updated VM');
      });
    });

    describe('DELETE /vm/:id', () => {
      it('should allow admin to delete VM without specific permissions', async () => {
        const adminUser = createMockUser(true);
        userRepository.findOneByField.mockResolvedValue(adminUser);
        mockStrategy.checkPermission.mockResolvedValue(false);

        await controller.deleteVm('vm-123');

        expect(userRepository.findOneByField).toHaveBeenCalled();
        expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
        expect(deleteVmUseCase.execute).toHaveBeenCalledWith('vm-123');
      });

      it('should check permissions for non-admin users', async () => {
        const normalUser = createMockUser(false);
        userRepository.findOneByField.mockResolvedValue(normalUser);
        mockStrategy.checkPermission.mockResolvedValue(true);

        await controller.deleteVm('vm-123');

        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'vm-123',
          PermissionBit.DELETE,
        );
        expect(deleteVmUseCase.execute).toHaveBeenCalledWith('vm-123');
      });
    });

    describe('PUT /vm/:id/priority', () => {
      it('should allow admin to update priority without specific permissions', async () => {
        const adminUser = createMockUser(true);
        userRepository.findOneByField.mockResolvedValue(adminUser);
        mockStrategy.checkPermission.mockResolvedValue(false);
        updateVmPriorityUseCase.execute.mockResolvedValue({
          id: 'vm-123',
          priority: 3,
        });

        const result = await controller.updatePriority(
          'vm-123',
          { priority: 3 },
          mockAdminUser,
        );

        expect(userRepository.findOneByField).toHaveBeenCalled();
        expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
        expect(updateVmPriorityUseCase.execute).toHaveBeenCalledWith(
          'vm-123',
          3,
          'admin-123',
        );
        expect(result.priority).toBe(3);
      });
    });
  });

  describe('Permission denied scenarios', () => {
    it('should throw ForbiddenException when non-admin lacks permissions', async () => {
      const normalUser = createMockUser(false);
      userRepository.findOneByField.mockResolvedValue(normalUser);
      mockStrategy.checkPermission.mockResolvedValue(false);

      await expect(controller.deleteVm('vm-123')).rejects.toThrow();

      expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
        'user-123',
        'vm-123',
        PermissionBit.DELETE,
      );
      expect(deleteVmUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle user with no roles gracefully', async () => {
      const userWithoutRoles = new User();
      userWithoutRoles.id = 'user-123';
      userWithoutRoles.roles = [];

      userRepository.findOneByField.mockResolvedValue(userWithoutRoles);
      mockStrategy.checkPermission.mockResolvedValue(true);

      await controller.deleteVm('vm-123');

      expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
        'user-123',
        'vm-123',
        PermissionBit.DELETE,
      );
    });

    it('should handle user with null isAdmin field', async () => {
      const userWithNullAdmin = new User();
      userWithNullAdmin.id = 'user-123';
      userWithNullAdmin.roles = [
        Object.assign(new Role(), {
          id: 'role-1',
          name: 'user',
          isAdmin: null,
        }),
      ];

      userRepository.findOneByField.mockResolvedValue(userWithNullAdmin);
      mockStrategy.checkPermission.mockResolvedValue(true);

      await controller.deleteVm('vm-123');

      expect(mockStrategy.checkPermission).toHaveBeenCalled();
    });
  });
});
