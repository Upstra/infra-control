import { ServerPermissionStrategy } from '../server-permission.strategy';
import { GetUserServerPermissionsUseCase } from '@/modules/permissions/application/use-cases/permission-server/get-user-permission-server-use-case';
import { PermissionUtils } from '@/core/utils/index';

jest.mock('@/core/utils/index', () => ({
  PermissionUtils: {
    has: jest.fn(),
  },
}));

describe('ServerPermissionStrategy', () => {
  let strategy: ServerPermissionStrategy;
  let getUserServerPermissionsUseCase: jest.Mocked<GetUserServerPermissionsUseCase>;
  let mockPermissionUtils: jest.Mocked<typeof PermissionUtils>;

  const mockPermissionServer = {
    id: 'permission-1',
    userId: 'user-123',
    serverId: 'server-123',
    bitmask: 7,
  };

  beforeEach(() => {
    getUserServerPermissionsUseCase = {
      execute: jest.fn(),
    } as any;

    mockPermissionUtils = PermissionUtils as jest.Mocked<
      typeof PermissionUtils
    >;
    mockPermissionUtils.has.mockClear();

    strategy = new ServerPermissionStrategy(getUserServerPermissionsUseCase);
  });

  describe('checkPermission', () => {
    it('should return true when user has required permission', async () => {
      getUserServerPermissionsUseCase.execute.mockResolvedValue([
        mockPermissionServer,
      ]);
      mockPermissionUtils.has.mockReturnValue(true);

      const result = await strategy.checkPermission(
        'user-123',
        'server-123',
        1,
      );

      expect(result).toBe(true);
      expect(getUserServerPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).toHaveBeenCalledWith(7, 1);
    });

    it('should return false when user does not have required permission', async () => {
      getUserServerPermissionsUseCase.execute.mockResolvedValue([
        mockPermissionServer,
      ]);
      mockPermissionUtils.has.mockReturnValue(false);

      const result = await strategy.checkPermission(
        'user-123',
        'server-123',
        8,
      );

      expect(result).toBe(false);
      expect(getUserServerPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).toHaveBeenCalledWith(7, 8);
    });

    it('should return false when server permission is not found', async () => {
      getUserServerPermissionsUseCase.execute.mockResolvedValue([
        mockPermissionServer,
      ]);

      const result = await strategy.checkPermission(
        'user-123',
        'server-999',
        1,
      );

      expect(result).toBe(false);
      expect(getUserServerPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).not.toHaveBeenCalled();
    });

    it('should return false when permissions array is empty', async () => {
      getUserServerPermissionsUseCase.execute.mockResolvedValue([]);

      const result = await strategy.checkPermission(
        'user-123',
        'server-123',
        1,
      );

      expect(result).toBe(false);
      expect(getUserServerPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).not.toHaveBeenCalled();
    });

    it('should return false when permissions is null', async () => {
      getUserServerPermissionsUseCase.execute.mockResolvedValue(null);

      const result = await strategy.checkPermission(
        'user-123',
        'server-123',
        1,
      );

      expect(result).toBe(false);
      expect(getUserServerPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).not.toHaveBeenCalled();
    });

    it('should return false when permissions is undefined', async () => {
      getUserServerPermissionsUseCase.execute.mockResolvedValue(undefined);

      const result = await strategy.checkPermission(
        'user-123',
        'server-123',
        1,
      );

      expect(result).toBe(false);
      expect(getUserServerPermissionsUseCase.execute).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockPermissionUtils.has).not.toHaveBeenCalled();
    });

    it('should handle multiple permissions and find the correct one', async () => {
      const permissions = [
        { ...mockPermissionServer, serverId: 'server-111', bitmask: 1 },
        { ...mockPermissionServer, serverId: 'server-123', bitmask: 7 },
        { ...mockPermissionServer, serverId: 'server-333', bitmask: 4 },
      ];
      getUserServerPermissionsUseCase.execute.mockResolvedValue(permissions);
      mockPermissionUtils.has.mockReturnValue(true);

      const result = await strategy.checkPermission(
        'user-123',
        'server-123',
        2,
      );

      expect(result).toBe(true);
      expect(mockPermissionUtils.has).toHaveBeenCalledWith(7, 2);
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Database connection failed');
      getUserServerPermissionsUseCase.execute.mockRejectedValue(error);

      await expect(
        strategy.checkPermission('user-123', 'server-123', 1),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
