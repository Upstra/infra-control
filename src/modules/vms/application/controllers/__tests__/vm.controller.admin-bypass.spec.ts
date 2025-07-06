import { Test, TestingModule } from '@nestjs/testing';
import { VmController } from '../vm.controller';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
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
import { Reflector } from '@nestjs/core';

describe('VmController - Admin Bypass Tests', () => {
  let controller: VmController;
  let updateVmUseCase: jest.Mocked<UpdateVmUseCase>;
  let deleteVmUseCase: jest.Mocked<DeleteVmUseCase>;
  let updateVmPriorityUseCase: jest.Mocked<UpdateVmPriorityUseCase>;
  let createVmUseCase: jest.Mocked<CreateVmUseCase>;

  const mockAdminUser: JwtPayload = {
    userId: 'admin-123',
    email: 'admin@example.com',
  };

  const mockNormalUser: JwtPayload = {
    userId: 'user-123',
    email: 'user@example.com',
  };

  const mockRequest: any = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
    },
    get: jest.fn((header: string) => {
      if (header === 'User-Agent') return 'test-agent';
      return undefined;
    }),
    sessionID: 'test-session-id',
  };

  beforeEach(async () => {
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
      controllers: [VmController],
      providers: [
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
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ResourcePermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<VmController>(VmController);
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

      it('should allow admin to create VM', async () => {
        createVmUseCase.execute.mockResolvedValue({
          id: 'vm-123',
          name: 'Test VM',
        } as any);

        const result = await controller.createVm(vmDto);

        expect(createVmUseCase.execute).toHaveBeenCalledWith(vmDto);
        expect(result.name).toBe('Test VM');
      });

      it('should allow non-admin to create VM when guard permits', async () => {
        createVmUseCase.execute.mockResolvedValue({
          id: 'vm-123',
          name: 'Test VM',
        } as any);

        const result = await controller.createVm(vmDto);

        expect(createVmUseCase.execute).toHaveBeenCalledWith(vmDto);
        expect(result.name).toBe('Test VM');
      });
    });

    describe('PATCH /vm/:id', () => {
      const vmDto: VmUpdateDto = {
        name: 'Updated VM',
      };

      it('should allow update when guard permits', async () => {
        updateVmUseCase.execute.mockResolvedValue({
          id: 'vm-123',
          name: 'Updated VM',
        } as any);

        const result = await controller.updateVm('vm-123', vmDto);

        expect(updateVmUseCase.execute).toHaveBeenCalledWith('vm-123', vmDto);
        expect(result.name).toBe('Updated VM');
      });
    });

    describe('DELETE /vm/:id', () => {
      it('should allow delete when guard permits', async () => {
        await controller.deleteVm('vm-123');

        expect(deleteVmUseCase.execute).toHaveBeenCalledWith('vm-123');
      });
    });

    describe('PUT /vm/:id/priority', () => {
      it('should allow priority update when guard permits', async () => {
        updateVmPriorityUseCase.execute.mockResolvedValue({
          id: 'vm-123',
          priority: 3,
        });

        const result = await controller.updatePriority(
          'vm-123',
          { priority: 3 },
          mockAdminUser,
        );

        expect(updateVmPriorityUseCase.execute).toHaveBeenCalledWith(
          'vm-123',
          3,
          'admin-123',
        );
        expect(result.priority).toBe(3);
      });
    });
  });
});
