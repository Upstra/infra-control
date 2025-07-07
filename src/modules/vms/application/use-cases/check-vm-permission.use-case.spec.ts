import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CheckVmPermissionUseCase } from './check-vm-permission.use-case';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';
import { Vm } from '../../domain/entities/vm.entity';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';

jest.mock('@/modules/permissions/application/utils/permission-resolver.util');

describe('CheckVmPermissionUseCase', () => {
  let useCase: CheckVmPermissionUseCase;
  let userRepo: jest.Mocked<UserRepositoryInterface>;
  let permissionRepo: jest.Mocked<PermissionVmRepositoryInterface>;
  let vmRepo: jest.Mocked<VmRepositoryInterface>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckVmPermissionUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
        {
          provide: 'PermissionVmRepositoryInterface',
          useValue: {},
        },
        {
          provide: 'VmRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CheckVmPermissionUseCase>(CheckVmPermissionUseCase);
    userRepo = module.get('UserRepositoryInterface');
    permissionRepo = module.get('PermissionVmRepositoryInterface');
    vmRepo = module.get('VmRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const vmId = 'vm-123';
    const userId = 'user-123';
    const permission = PermissionBit.READ;

    it('should return hasPermission: true when user has the required permission', async () => {
      const mockVm = { id: vmId } as Vm;
      const mockRole = { id: 'role-123' } as Role;
      const mockUser = {
        id: userId,
        roles: [mockRole],
      } as User;

      const mockPermission = new PermissionVm();
      mockPermission.vmId = vmId;
      mockPermission.bitmask = PermissionBit.READ | PermissionBit.WRITE;

      vmRepo.findOneByField.mockResolvedValue(mockVm);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      (PermissionResolver.resolveVmPermissions as jest.Mock).mockResolvedValue([
        mockPermission,
      ]);

      const result = await useCase.execute(vmId, userId, permission);

      expect(result).toEqual({
        hasPermission: true,
        userId,
        resourceId: vmId,
        resourceType: 'vm',
        permission,
      });

      expect(vmRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: vmId,
      });
      expect(userRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: userId,
        relations: ['roles'],
      });
      expect(PermissionResolver.resolveVmPermissions).toHaveBeenCalledWith(
        permissionRepo,
        ['role-123'],
      );
    });

    it('should return hasPermission: false when user does not have the required permission', async () => {
      const mockVm = { id: vmId } as Vm;
      const mockRole = { id: 'role-123' } as Role;
      const mockUser = {
        id: userId,
        roles: [mockRole],
      } as User;

      const mockPermission = new PermissionVm();
      mockPermission.vmId = 'other-vm';
      mockPermission.bitmask = PermissionBit.READ;

      vmRepo.findOneByField.mockResolvedValue(mockVm);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      (PermissionResolver.resolveVmPermissions as jest.Mock).mockResolvedValue([
        mockPermission,
      ]);

      const result = await useCase.execute(vmId, userId, permission);

      expect(result).toEqual({
        hasPermission: false,
        userId,
        resourceId: vmId,
        resourceType: 'vm',
        permission,
      });
    });

    it('should return hasPermission: false when user has no roles', async () => {
      const mockVm = { id: vmId } as Vm;
      const mockUser = {
        id: userId,
        roles: [],
      } as User;

      vmRepo.findOneByField.mockResolvedValue(mockVm);
      userRepo.findOneByField.mockResolvedValue(mockUser);

      const result = await useCase.execute(vmId, userId, permission);

      expect(result).toEqual({
        hasPermission: false,
        userId,
        resourceId: vmId,
        resourceType: 'vm',
        permission,
      });

      expect(PermissionResolver.resolveVmPermissions).not.toHaveBeenCalled();
    });

    it('should return hasPermission: false when user is not found', async () => {
      const mockVm = { id: vmId } as Vm;

      vmRepo.findOneByField.mockResolvedValue(mockVm);
      userRepo.findOneByField.mockResolvedValue(null);

      const result = await useCase.execute(vmId, userId, permission);

      expect(result).toEqual({
        hasPermission: false,
        userId,
        resourceId: vmId,
        resourceType: 'vm',
        permission,
      });
    });

    it('should throw NotFoundException when VM does not exist', async () => {
      vmRepo.findOneByField.mockResolvedValue(null);

      await expect(useCase.execute(vmId, userId, permission)).rejects.toThrow(
        NotFoundException,
      );

      expect(vmRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: vmId,
      });
      expect(userRepo.findOneByField).not.toHaveBeenCalled();
    });

    it('should handle global permissions correctly', async () => {
      const mockVm = { id: vmId } as Vm;
      const mockRole = { id: 'role-123' } as Role;
      const mockUser = {
        id: userId,
        roles: [mockRole],
      } as User;

      const mockGlobalPermission = new PermissionVm();
      mockGlobalPermission.vmId = undefined;
      mockGlobalPermission.bitmask = PermissionBit.READ | PermissionBit.WRITE;

      vmRepo.findOneByField.mockResolvedValue(mockVm);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      (PermissionResolver.resolveVmPermissions as jest.Mock).mockResolvedValue([
        mockGlobalPermission,
      ]);

      const result = await useCase.execute(vmId, userId, permission);

      expect(result).toEqual({
        hasPermission: true,
        userId,
        resourceId: vmId,
        resourceType: 'vm',
        permission,
      });
    });

    it('should check for specific permission bit correctly', async () => {
      const mockVm = { id: vmId } as Vm;
      const mockRole = { id: 'role-123' } as Role;
      const mockUser = {
        id: userId,
        roles: [mockRole],
      } as User;

      const mockPermission = new PermissionVm();
      mockPermission.vmId = vmId;
      mockPermission.bitmask = PermissionBit.READ | PermissionBit.WRITE;

      vmRepo.findOneByField.mockResolvedValue(mockVm);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      (PermissionResolver.resolveVmPermissions as jest.Mock).mockResolvedValue([
        mockPermission,
      ]);

      const deleteResult = await useCase.execute(
        vmId,
        userId,
        PermissionBit.DELETE,
      );

      expect(deleteResult.hasPermission).toBe(false);

      const readResult = await useCase.execute(
        vmId,
        userId,
        PermissionBit.READ,
      );

      expect(readResult.hasPermission).toBe(true);
    });
  });
});
