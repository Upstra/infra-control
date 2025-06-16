import { VmPermissionStrategy } from '../vm-permission.strategy';
import { GetUserVmPermissionsUseCase } from '@/modules/permissions/application/use-cases/permission-vm/get-user-permission-vm-use-case';
import { PermissionUtils } from '@/core/utils/index';

jest.mock('@/core/utils/index', () => ({
  PermissionUtils: {
    has: jest.fn(),
  },
}));

describe('VmPermissionStrategy', () => {
  let strategy: VmPermissionStrategy;
  let getUserVmPermissionsUseCase: jest.Mocked<GetUserVmPermissionsUseCase>;
  let mockPermissionUtils: jest.Mocked<typeof PermissionUtils>;

  const mockPermissionVm = {
    id: 'permission-1',
    userId: 'user-123',
    vmId: 'vm-123',
    bitmask: 7,
  };

  beforeEach(() => {
    getUserVmPermissionsUseCase = {
      execute: jest.fn(),
    } as any;

    mockPermissionUtils = PermissionUtils as jest.Mocked<
      typeof PermissionUtils
    >;
    mockPermissionUtils.has.mockClear();

    strategy = new VmPermissionStrategy(getUserVmPermissionsUseCase);
  });

  describe('checkPermission', () => {
    it('should return true when user has required permission', async () => {
      getUserVmPermissionsUseCase.execute.mockResolvedValue([mockPermissionVm]);
      mockPermissionUtils.has.mockReturnValue(true);

      const result = await strategy.checkPermission('user-123', 'vm-123', 1);

      expect(result).toBe(true);
      expect(getUserVmPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).toHaveBeenCalledWith(7, 1);
    });

    it('should return false when user does not have required permission', async () => {
      getUserVmPermissionsUseCase.execute.mockResolvedValue([mockPermissionVm]);
      mockPermissionUtils.has.mockReturnValue(false);

      const result = await strategy.checkPermission('user-123', 'vm-123', 8);

      expect(result).toBe(false);
      expect(getUserVmPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).toHaveBeenCalledWith(7, 8);
    });

    it('should return false when vm permission is not found', async () => {
      getUserVmPermissionsUseCase.execute.mockResolvedValue([mockPermissionVm]);

      const result = await strategy.checkPermission('user-123', 'vm-999', 1);

      expect(result).toBe(false);
      expect(getUserVmPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).not.toHaveBeenCalled();
    });

    it('should return false when permissions array is empty', async () => {
      getUserVmPermissionsUseCase.execute.mockResolvedValue([]);

      const result = await strategy.checkPermission('user-123', 'vm-123', 1);

      expect(result).toBe(false);
      expect(getUserVmPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).not.toHaveBeenCalled();
    });

    it('should return false when permissions is null', async () => {
      getUserVmPermissionsUseCase.execute.mockResolvedValue(null);

      const result = await strategy.checkPermission('user-123', 'vm-123', 1);

      expect(result).toBe(false);
      expect(getUserVmPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).not.toHaveBeenCalled();
    });

    it('should return false when permissions is undefined', async () => {
      getUserVmPermissionsUseCase.execute.mockResolvedValue(undefined);

      const result = await strategy.checkPermission('user-123', 'vm-123', 1);

      expect(result).toBe(false);
      expect(getUserVmPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).not.toHaveBeenCalled();
    });

    it('should handle multiple permissions and find the correct one', async () => {
      const permissions = [
        { ...mockPermissionVm, vmId: 'vm-111', bitmask: 1 },
        { ...mockPermissionVm, vmId: 'vm-123', bitmask: 7 },
        { ...mockPermissionVm, vmId: 'vm-333', bitmask: 4 },
      ];
      getUserVmPermissionsUseCase.execute.mockResolvedValue(permissions);
      mockPermissionUtils.has.mockReturnValue(true);

      const result = await strategy.checkPermission('user-123', 'vm-123', 2);

      expect(result).toBe(true);
      expect(mockPermissionUtils.has).toHaveBeenCalledWith(7, 2);
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Database connection failed');
      getUserVmPermissionsUseCase.execute.mockRejectedValue(error);

      await expect(
        strategy.checkPermission('user-123', 'vm-123', 1),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
