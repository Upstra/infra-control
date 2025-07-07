import { Test, TestingModule } from '@nestjs/testing';
import { PermissionVmController } from '../permission.vm.controller';
import {
  CreatePermissionVmUseCase,
  CreateBatchPermissionVmUseCase,
  UpdatePermissionVmUseCase,
  GetPermissionVmByIdsUseCase,
  GetPermissionsVmByRoleUseCase,
  DeletePermissionVmUseCase,
  GetUserVmPermissionsUseCase,
} from '../../use-cases/permission-vm';
import { PermissionVmDto, UpdatePermissionVmDto } from '../../dto/permission.vm.dto';
import { BatchPermissionVmDto, BatchPermissionVmResponseDto } from '../../dto/batch-permission.vm.dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

describe('PermissionVmController', () => {
  let controller: PermissionVmController;
  let createUseCaseMock: jest.Mocked<CreatePermissionVmUseCase>;
  let createBatchUseCaseMock: jest.Mocked<CreateBatchPermissionVmUseCase>;
  let updateUseCaseMock: jest.Mocked<UpdatePermissionVmUseCase>;
  let getByIdsUseCaseMock: jest.Mocked<GetPermissionVmByIdsUseCase>;
  let getByRoleUseCaseMock: jest.Mocked<GetPermissionsVmByRoleUseCase>;
  let deleteUseCaseMock: jest.Mocked<DeletePermissionVmUseCase>;
  let getUserPermissionsUseCaseMock: jest.Mocked<GetUserVmPermissionsUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionVmController],
      providers: [
        {
          provide: CreatePermissionVmUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CreateBatchPermissionVmUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdatePermissionVmUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetPermissionVmByIdsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetPermissionsVmByRoleUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeletePermissionVmUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetUserVmPermissionsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PermissionVmController>(PermissionVmController);
    createUseCaseMock = module.get(CreatePermissionVmUseCase);
    createBatchUseCaseMock = module.get(CreateBatchPermissionVmUseCase);
    updateUseCaseMock = module.get(UpdatePermissionVmUseCase);
    getByIdsUseCaseMock = module.get(GetPermissionVmByIdsUseCase);
    getByRoleUseCaseMock = module.get(GetPermissionsVmByRoleUseCase);
    deleteUseCaseMock = module.get(DeletePermissionVmUseCase);
    getUserPermissionsUseCaseMock = module.get(GetUserVmPermissionsUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      const dto: PermissionVmDto = {
        vmId: 'vm-id',
        roleId: 'role-id',
        bitmask: 15,
      };
      const expectedResult = new PermissionVmDto(dto);

      createUseCaseMock.execute.mockResolvedValue(expectedResult);

      const result = await controller.createPermission(dto);

      expect(result).toEqual(expectedResult);
      expect(createUseCaseMock.execute).toHaveBeenCalledWith(dto);
    });
  });

  describe('updatePermission', () => {
    it('should update an existing permission', async () => {
      const vmId = 'vm-id';
      const roleId = 'role-id';
      const dto: UpdatePermissionVmDto = {
        bitmask: 7,
      };
      const expectedResult = new PermissionVmDto({
        vmId,
        roleId,
        bitmask: 7,
      });

      updateUseCaseMock.execute.mockResolvedValue(expectedResult);

      const result = await controller.updatePermission(vmId, roleId, dto);

      expect(result).toEqual(expectedResult);
      expect(updateUseCaseMock.execute).toHaveBeenCalledWith(vmId, roleId, dto);
    });

    it('should update permission with different bitmask values', async () => {
      const vmId = 'vm-id';
      const roleId = 'role-id';
      const testCases = [
        { bitmask: 0 },
        { bitmask: 1 },
        { bitmask: 15 },
        { bitmask: 255 },
      ];

      for (const testCase of testCases) {
        const dto: UpdatePermissionVmDto = {
          bitmask: testCase.bitmask,
        };
        const expectedResult = new PermissionVmDto({
          vmId,
          roleId,
          bitmask: testCase.bitmask,
        });

        updateUseCaseMock.execute.mockResolvedValue(expectedResult);

        const result = await controller.updatePermission(vmId, roleId, dto);

        expect(result).toEqual(expectedResult);
        expect(updateUseCaseMock.execute).toHaveBeenCalledWith(vmId, roleId, dto);
      }
    });
  });

  describe('getPermissionByIds', () => {
    it('should return permission by ids', async () => {
      const vmId = 'vm-id';
      const roleId = 'role-id';
      const expectedResult = new PermissionVmDto({
        vmId,
        roleId,
        bitmask: 15,
      });

      getByIdsUseCaseMock.execute.mockResolvedValue(expectedResult);

      const result = await controller.getPermissionByIds(vmId, roleId);

      expect(result).toEqual(expectedResult);
      expect(getByIdsUseCaseMock.execute).toHaveBeenCalledWith(vmId, roleId);
    });
  });

  describe('getPermissionsByRole', () => {
    it('should return permissions by role', async () => {
      const roleId = 'role-id';
      const expectedResult = [
        new PermissionVmDto({
          vmId: 'vm-1',
          roleId,
          bitmask: 15,
        }),
        new PermissionVmDto({
          vmId: 'vm-2',
          roleId,
          bitmask: 7,
        }),
      ];

      getByRoleUseCaseMock.execute.mockResolvedValue(expectedResult);

      const result = await controller.getPermissionsByRole(roleId);

      expect(result).toEqual(expectedResult);
      expect(getByRoleUseCaseMock.execute).toHaveBeenCalledWith(roleId);
    });
  });

  describe('deletePermission', () => {
    it('should delete a permission', async () => {
      const vmId = 'vm-id';
      const roleId = 'role-id';

      deleteUseCaseMock.execute.mockResolvedValue(undefined);

      await controller.deletePermission(vmId, roleId);

      expect(deleteUseCaseMock.execute).toHaveBeenCalledWith(vmId, roleId);
    });
  });

  describe('getUserPermissionsMe', () => {
    it('should return current user permissions', async () => {
      const user: JwtPayload = {
        userId: 'user-id',
        email: 'testuser@example.com',
      };
      const expectedResult = [
        new PermissionVmDto({
          vmId: 'vm-1',
          roleId: 'role-1',
          bitmask: 15,
        }),
      ];

      getUserPermissionsUseCaseMock.execute.mockResolvedValue(expectedResult);

      const result = await controller.getUserPermissionsMe(user);

      expect(result).toEqual(expectedResult);
      expect(getUserPermissionsUseCaseMock.execute).toHaveBeenCalledWith(user.userId);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions by userId', async () => {
      const userId = 'user-id';
      const expectedResult = [
        new PermissionVmDto({
          vmId: 'vm-1',
          roleId: 'role-1',
          bitmask: 15,
        }),
      ];

      getUserPermissionsUseCaseMock.execute.mockResolvedValue(expectedResult);

      const result = await controller.getUserPermissions(userId);

      expect(result).toEqual(expectedResult);
      expect(getUserPermissionsUseCaseMock.execute).toHaveBeenCalledWith(userId);
    });
  });

  describe('createBatchPermissions', () => {
    it('should create multiple permissions successfully', async () => {
      const batchDto = new BatchPermissionVmDto();
      batchDto.permissions = [
        {
          vmId: 'vm-1',
          roleId: 'role-1',
          bitmask: 15,
        },
        {
          vmId: 'vm-2',
          roleId: 'role-2',
          bitmask: 7,
        },
      ];

      const expectedResult: BatchPermissionVmResponseDto = {
        created: batchDto.permissions.map(p => new PermissionVmDto(p)),
        failed: [],
        total: 2,
        successCount: 2,
        failureCount: 0,
      };

      createBatchUseCaseMock.execute.mockResolvedValue(expectedResult);

      const result = await controller.createBatchPermissions(batchDto);

      expect(result).toEqual(expectedResult);
      expect(createBatchUseCaseMock.execute).toHaveBeenCalledWith(batchDto);
    });

    it('should handle partial failures in batch creation', async () => {
      const batchDto = new BatchPermissionVmDto();
      batchDto.permissions = [
        {
          vmId: 'vm-1',
          roleId: 'role-1',
          bitmask: 15,
        },
        {
          vmId: 'vm-2',
          roleId: 'role-2',
          bitmask: 7,
        },
      ];

      const expectedResult: BatchPermissionVmResponseDto = {
        created: [new PermissionVmDto(batchDto.permissions[0])],
        failed: [{
          permission: batchDto.permissions[1],
          error: 'VM not found',
        }],
        total: 2,
        successCount: 1,
        failureCount: 1,
      };

      createBatchUseCaseMock.execute.mockResolvedValue(expectedResult);

      const result = await controller.createBatchPermissions(batchDto);

      expect(result).toEqual(expectedResult);
      expect(result.failureCount).toBe(1);
      expect(result.failed[0].error).toBe('VM not found');
    });
  });
});