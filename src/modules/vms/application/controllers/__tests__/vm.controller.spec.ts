import { Test, TestingModule } from '@nestjs/testing';
import { VmController } from '../vm.controller';
import {
  CreateVmUseCase,
  DeleteVmUseCase,
  GetAllVmsUseCase,
  GetVmListUseCase,
  GetVmByIdUseCase,
  UpdateVmUseCase,
  UpdateVmPriorityUseCase,
} from '../../use-cases';
import {
  createMockVm,
  createMockVmResponseDto,
} from '../../../__mocks__/vms.mock';
import { VmCreationDto } from '../../dto/vm.creation.dto';
import { VmUpdateDto } from '../../dto/vm.update.dto';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

describe('VmController', () => {
  let controller: VmController;
  let getAllVmsUseCase: jest.Mocked<GetAllVmsUseCase>;
  let getVmListUseCase: jest.Mocked<GetVmListUseCase>;
  let getVmByIdUseCase: jest.Mocked<GetVmByIdUseCase>;
  let createVmUseCase: jest.Mocked<CreateVmUseCase>;
  let updateVmUseCase: jest.Mocked<UpdateVmUseCase>;
  let deleteVmUseCase: jest.Mocked<DeleteVmUseCase>;
  let updateVmPriorityUseCase: jest.Mocked<UpdateVmPriorityUseCase>;

  beforeEach(async () => {
    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockResourcePermissionGuard = {
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
    getVmListUseCase = { execute: jest.fn() } as any;
    getVmByIdUseCase = { execute: jest.fn() } as any;
    createVmUseCase = { execute: jest.fn() } as any;
    updateVmUseCase = { execute: jest.fn() } as any;
    deleteVmUseCase = { execute: jest.fn() } as any;
    updateVmPriorityUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VmController],
      providers: [
        { provide: GetAllVmsUseCase, useValue: getAllVmsUseCase },
        { provide: GetVmListUseCase, useValue: getVmListUseCase },
        { provide: GetVmByIdUseCase, useValue: getVmByIdUseCase },
        { provide: CreateVmUseCase, useValue: createVmUseCase },
        { provide: UpdateVmUseCase, useValue: updateVmUseCase },
        { provide: DeleteVmUseCase, useValue: deleteVmUseCase },
        { provide: UpdateVmPriorityUseCase, useValue: updateVmPriorityUseCase },
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

      const mockUser = { userId: 'user-123', email: 'user@example.com' };
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      const result = await controller.createVm(dto, mockUser, mockReq);

      expect(result).toEqual(vm);
      expect(createVmUseCase.execute).toHaveBeenCalledWith(
        dto,
        'user-123',
        expect.any(Object),
      );
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

      const mockUser = { userId: 'user-123', email: 'user@example.com' };
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      await expect(controller.createVm(dto, mockUser, mockReq)).rejects.toThrow(
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
});
