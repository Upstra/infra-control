import { ForbiddenException } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionUtils } from '@/core/utils';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from '@/core/guards';
import { createMockPermissionServerDto } from '@/modules/permissions/__mocks__/permissions.mock';

const mockReflector = {
  get: jest.fn(),
} as jest.Mocked<Pick<Reflector, 'get'>>;

const mockGetUserServerPermissionsUseCase = {
  execute: jest.fn(),
};

const createMockExecutionContext = (user: any = { userId: 'user-1' }) => ({
  switchToHttp: () => ({
    getRequest: () => ({
      user,
    }),
  }),
  getHandler: () => jest.fn(),
});

describe('PermissionGuard', () => {
  let guard: PermissionGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    guard = new PermissionGuard(
      mockReflector as any,
      mockGetUserServerPermissionsUseCase as any,
    );
  });

  describe('Server Permissions', () => {
    it('should allow access for server permission (permission OK)', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [createMockPermissionServerDto({ bitmask: 3 })],
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(true);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });

    it('should allow access when user has multiple server permissions and one matches', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.WRITE,
      });
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [
          createMockPermissionServerDto({ bitmask: 1 }), // READ only
          createMockPermissionServerDto({ bitmask: 6 }), // WRITE + DELETE
        ],
      });
      jest
        .spyOn(PermissionUtils, 'has')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });

    it('should deny access when server permissions list is empty', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [],
      });

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });

    it('should deny access when no server permission matches', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.DELETE,
      });
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [
          createMockPermissionServerDto({ bitmask: 1 }), // READ only
          createMockPermissionServerDto({ bitmask: 2 }), // WRITE only
        ],
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(false);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });
  });

  describe('Error Cases', () => {
    it('should throw if type is not server/vm (Invalid permission type)', async () => {
      mockReflector.get.mockReturnValue({
        type: 'unknown',
        requiredBit: PermissionBit.READ,
      });

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ForbiddenException('Invalid permission type'),
      );
    });

    it('should throw if reflector.get returns undefined', async () => {
      mockReflector.get.mockReturnValue(undefined);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ForbiddenException('Invalid permission type'),
      );
    });

    it('should throw if reflector.get returns null', async () => {
      mockReflector.get.mockReturnValue(null);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ForbiddenException('Invalid permission type'),
      );
    });

    it('should throw if reflector.get returns object without type', async () => {
      mockReflector.get.mockReturnValue({
        requiredBit: PermissionBit.READ,
        // type manquant
      });

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ForbiddenException('Invalid permission type'),
      );
    });

    it('should throw if server use case returns null/undefined', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue(null);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ForbiddenException('No role found'),
      );
    });

    it('should handle when user is undefined in request', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });

      const context = createMockExecutionContext(undefined);

      await expect(guard.canActivate(context as any)).rejects.toThrow();
    });

    it('should handle when user.userId is undefined', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });

      const context = createMockExecutionContext({ userId: undefined });

      // Le use case devrait recevoir undefined comme userId
      mockGetUserServerPermissionsUseCase.execute.mockRejectedValue(
        new Error('Invalid userId'),
      );

      await expect(guard.canActivate(context as any)).rejects.toThrow(
        'Invalid userId',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle server use case throwing an error', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });
      mockGetUserServerPermissionsUseCase.execute.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle very large bitmask values', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [
          createMockPermissionServerDto({ bitmask: Number.MAX_SAFE_INTEGER }),
        ],
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(true);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });

    it('should handle negative bitmask gracefully', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [createMockPermissionServerDto({ bitmask: -1 })],
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(false);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });

    it('should work with requiredBit being 0', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: 0, // Cas limite
      });
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [createMockPermissionServerDto({ bitmask: 0 })],
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(true);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });
  });

  describe('Permission Lists Structure', () => {
    it('should handle server permissions with different structures', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });

      // Structure avec des propriétés supplémentaires
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [
          {
            bitmask: 1,
            serverId: 'server-1',
            roleId: 'role-1',
            extraProp: 'should-be-ignored',
          },
        ],
        otherProp: 'should-be-ignored-too',
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(true);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });
  });
});
