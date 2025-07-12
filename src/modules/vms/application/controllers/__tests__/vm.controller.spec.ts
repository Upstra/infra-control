import { Test, TestingModule } from '@nestjs/testing';
import { VmController } from '../vm.controller';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';
import {
  CreateVmUseCase,
  DeleteVmUseCase,
  GetAllVmsUseCase,
  GetAllVmsAdminUseCase,
  GetVmListUseCase,
  GetVmByIdUseCase,
  UpdateVmUseCase,
  UpdateVmPriorityUseCase,
  CheckVmPermissionUseCase,
} from '../../use-cases';
import {
  createMockVm,
  createMockVmResponseDto,
} from '../../../__mocks__/vms.mock';
import { VmCreationDto } from '../../dto/vm.creation.dto';
import { VmUpdateDto } from '../../dto/vm.update.dto';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { Reflector } from '@nestjs/core';

describe('VmController', () => {
  let controller: VmController;
  let getAllVmsUseCase: jest.Mocked<GetAllVmsUseCase>;
  let getAllVmsAdminUseCase: jest.Mocked<GetAllVmsAdminUseCase>;
  let getVmListUseCase: jest.Mocked<GetVmListUseCase>;
  let getVmByIdUseCase: jest.Mocked<GetVmByIdUseCase>;
  let createVmUseCase: jest.Mocked<CreateVmUseCase>;
  let updateVmUseCase: jest.Mocked<UpdateVmUseCase>;
  let deleteVmUseCase: jest.Mocked<DeleteVmUseCase>;
  let updateVmPriorityUseCase: jest.Mocked<UpdateVmPriorityUseCase>;
  let checkVmPermissionUseCase: jest.Mocked<CheckVmPermissionUseCase>;

  beforeEach(async () => {
    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockResourcePermissionGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockRoleGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockPermissionStrategyFactory = {
      getStrategy: jest.fn().mockReturnValue({
        checkPermission: jest.fn().mockResolvedValue(true),
      }),
    };

    const mockReflector = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    };

    getAllVmsUseCase = { execute: jest.fn() } as any;
    getAllVmsAdminUseCase = { execute: jest.fn() } as any;
    getVmListUseCase = { execute: jest.fn() } as any;
    getVmByIdUseCase = { execute: jest.fn() } as any;
    createVmUseCase = { execute: jest.fn() } as any;
    updateVmUseCase = { execute: jest.fn() } as any;
    deleteVmUseCase = { execute: jest.fn() } as any;
    updateVmPriorityUseCase = { execute: jest.fn() } as any;
    checkVmPermissionUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VmController],
      providers: [
        { provide: GetAllVmsUseCase, useValue: getAllVmsUseCase },
        { provide: GetAllVmsAdminUseCase, useValue: getAllVmsAdminUseCase },
        { provide: GetVmListUseCase, useValue: getVmListUseCase },
        { provide: GetVmByIdUseCase, useValue: getVmByIdUseCase },
        { provide: CreateVmUseCase, useValue: createVmUseCase },
        { provide: UpdateVmUseCase, useValue: updateVmUseCase },
        { provide: DeleteVmUseCase, useValue: deleteVmUseCase },
        { provide: UpdateVmPriorityUseCase, useValue: updateVmPriorityUseCase },
        {
          provide: CheckVmPermissionUseCase,
          useValue: checkVmPermissionUseCase,
        },
        {
          provide: 'PermissionStrategyFactory',
          useValue: mockPermissionStrategyFactory,
        },
        { provide: Reflector, useValue: mockReflector },
      ],
    })

      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(ResourcePermissionGuard)
      .useValue(mockResourcePermissionGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get<VmController>(VmController);
  });

  describe('getAllVms', () => {
    it('should return all VMs', async () => {
      const vm = createMockVmResponseDto();
      getAllVmsUseCase.execute.mockResolvedValue([vm]);

      const result = await controller.getAllVms();

      expect(result).toEqual([vm]);
      expect(getAllVmsUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('getVms', () => {
    it('should return paginated VMs', async () => {
      const mock = { items: [createMockVm()] } as any;
      getVmListUseCase.execute.mockResolvedValue(mock);
      const result = await controller.getVms('1', '5');
      expect(result).toBe(mock);
      expect(getVmListUseCase.execute).toHaveBeenCalledWith(1, 5);
    });

    it('should use default pagination', async () => {
      const mock = { items: [] } as any;
      getVmListUseCase.execute.mockResolvedValue(mock);
      const result = await controller.getVms();
      expect(result).toBe(mock);
      expect(getVmListUseCase.execute).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getVmById', () => {
    it('should return a VM by ID', async () => {
      const vm = createMockVmResponseDto();
      getVmByIdUseCase.execute.mockResolvedValue(vm);

      const result = await controller.getVmById('vm-1');

      expect(result).toEqual(vm);
      expect(getVmByIdUseCase.execute).toHaveBeenCalledWith('vm-1');
    });

    it('should throw if VM is not found', async () => {
      getVmByIdUseCase.execute.mockRejectedValue(new Error('VM not found'));

      await expect(controller.getVmById('nonexistent-vm')).rejects.toThrow(
        'VM not found',
      );
    });
  });

  describe('createVm', () => {
    it('should create a VM', async () => {
      const vm = createMockVmResponseDto();
      const dto: VmCreationDto = {
        name: vm.name,
        state: vm.state,
        grace_period_on: vm.grace_period_on,
        grace_period_off: vm.grace_period_off,
        os: vm.os,
        adminUrl: vm.adminUrl,
        ip: vm.ip,
        login: 'admin',
        password: 'password',
        priority: vm.priority,
        serverId: vm.serverId,
        groupId: vm.groupId,
      };
      createVmUseCase.execute.mockResolvedValue(vm);

      const _mockUser = { userId: 'user-123', email: 'user@example.com' };
      const result = await controller.createVm(dto);

      expect(result).toEqual(vm);
      expect(createVmUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('should throw if VM creation fails', async () => {
      const dto: VmCreationDto = {
        name: 'Test VM',
        state: 'active',
        grace_period_on: 10,
        grace_period_off: 10,
        os: 'Ubuntu',
        adminUrl: 'https://admin.example.com',
        ip: '192.168.1.100',
        login: 'admin',
        password: 'password',
        priority: 1,
        serverId: 'server-123',
        groupId: 'group-123',
      };

      createVmUseCase.execute.mockRejectedValue(
        new Error('VM creation failed'),
      );

      const _mockUser = { userId: 'user-123', email: 'user@example.com' };
      const _mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      await expect(controller.createVm(dto)).rejects.toThrow(
        'VM creation failed',
      );
    });
  });

  describe('updateVm', () => {
    it('should update a VM', async () => {
      const vm = createMockVmResponseDto();
      const dto: VmUpdateDto = {
        name: 'Updated Name',
      };
      updateVmUseCase.execute.mockResolvedValue(vm);

      const result = await controller.updateVm('vm-1', dto);

      expect(result).toEqual(vm);
      expect(updateVmUseCase.execute).toHaveBeenCalledWith('vm-1', dto);
    });

    it('should throw if VM update fails', async () => {
      const dto: VmUpdateDto = {
        name: 'Updated Name',
      };
      updateVmUseCase.execute.mockRejectedValue(new Error('VM not found'));

      await expect(controller.updateVm('invalid-vm', dto)).rejects.toThrow(
        'VM not found',
      );
    });
  });

  describe('deleteVm', () => {
    it('should delete a VM', async () => {
      deleteVmUseCase.execute.mockResolvedValue(undefined);

      await controller.deleteVm('vm-1');

      expect(deleteVmUseCase.execute).toHaveBeenCalledWith('vm-1');
    });

    it('should throw if VM deletion fails', async () => {
      deleteVmUseCase.execute.mockRejectedValue(new Error('VM not found'));

      await expect(controller.deleteVm('invalid-vm')).rejects.toThrow(
        'VM not found',
      );
    });
  });

  describe('checkPermission', () => {
    const mockPayload = createMockJwtPayload();

    it('should check if user has permission on a VM', async () => {
      const dto = {
        vmId: 'vm-123',
        permission: 1, // PermissionBit.READ
      };

      const expectedResponse = {
        hasPermission: true,
        userId: mockPayload.userId,
        resourceId: dto.vmId,
        resourceType: 'vm' as const,
        permission: dto.permission,
      };

      checkVmPermissionUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.checkPermission(dto, mockPayload);

      expect(result).toEqual(expectedResponse);
      expect(checkVmPermissionUseCase.execute).toHaveBeenCalledWith(
        dto.vmId,
        mockPayload.userId,
        dto.permission,
      );
    });

    it('should return false when user does not have permission', async () => {
      const dto = {
        vmId: 'vm-123',
        permission: 4, // PermissionBit.DELETE
      };

      const expectedResponse = {
        hasPermission: false,
        userId: mockPayload.userId,
        resourceId: dto.vmId,
        resourceType: 'vm' as const,
        permission: dto.permission,
      };

      checkVmPermissionUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.checkPermission(dto, mockPayload);

      expect(result).toEqual(expectedResponse);
      expect(result.hasPermission).toBe(false);
    });

    it('should throw NotFoundException when VM does not exist', async () => {
      const dto = {
        vmId: 'nonexistent-vm',
        permission: 1,
      };

      checkVmPermissionUseCase.execute.mockRejectedValue(
        new Error('VM not found'),
      );

      await expect(
        controller.checkPermission(dto, mockPayload),
      ).rejects.toThrow('VM not found');
    });
  });

  describe('getAllVmsAdmin', () => {
    it('should return all VMs for admin users', async () => {
      const vms = [
        createMockVmResponseDto({ id: 'vm-1', name: 'Admin VM 1' }),
        createMockVmResponseDto({ id: 'vm-2', name: 'Admin VM 2' }),
        createMockVmResponseDto({ id: 'vm-3', name: 'Admin VM 3' }),
      ];
      getAllVmsAdminUseCase.execute.mockResolvedValue(vms);

      const result = await controller.getAllVmsAdmin();

      expect(result).toEqual(vms);
      expect(getAllVmsAdminUseCase.execute).toHaveBeenCalledWith();
      expect(getAllVmsAdminUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no VMs exist', async () => {
      getAllVmsAdminUseCase.execute.mockResolvedValue([]);

      const result = await controller.getAllVmsAdmin();

      expect(result).toEqual([]);
      expect(getAllVmsAdminUseCase.execute).toHaveBeenCalledWith();
    });

    it('should handle large number of VMs', async () => {
      const vms = Array.from({ length: 100 }, (_, i) =>
        createMockVmResponseDto({ id: `vm-${i}`, name: `VM ${i}` }),
      );
      getAllVmsAdminUseCase.execute.mockResolvedValue(vms);

      const result = await controller.getAllVmsAdmin();

      expect(result).toHaveLength(100);
      expect(result[0].id).toBe('vm-0');
      expect(result[99].id).toBe('vm-99');
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Database error');
      getAllVmsAdminUseCase.execute.mockRejectedValue(error);

      await expect(controller.getAllVmsAdmin()).rejects.toThrow(error);
    });
  });
});
