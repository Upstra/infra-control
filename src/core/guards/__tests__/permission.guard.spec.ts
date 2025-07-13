import { ForbiddenException } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionUtils } from '@/core/utils/index';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from '../permission.guard';
import {
  createMockPermissionServerDto,
  createMockPermissionVmDto,
} from '@/modules/permissions/__mocks__/permissions.mock';

const mockReflector = {
  get: jest.fn(),
} as jest.Mocked<Pick<Reflector, 'get'>>;

const mockGetUserServerPermissionsUseCase = {
  execute: jest.fn(),
};

const mockGetUserVmPermissionsUseCase = {
  execute: jest.fn(),
};

const mockUserRepository = {
  findOneByField: jest.fn(),
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
      mockGetUserVmPermissionsUseCase as any,
      mockUserRepository as any,
    );
  });

  describe('Admin Bypass', () => {
    it('should bypass all permission checks when user is admin', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.DELETE,
      });
      
      mockUserRepository.findOneByField.mockResolvedValue({
        id: 'user-1',
        roles: [{ id: 'role-1', isAdmin: true }],
      });

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
      
      expect(mockGetUserServerPermissionsUseCase.execute).not.toHaveBeenCalled();
      expect(mockGetUserVmPermissionsUseCase.execute).not.toHaveBeenCalled();
    });

    it('should bypass vm permissions when user is admin', async () => {
      mockReflector.get.mockReturnValue({
        type: 'vm',
        requiredBit: PermissionBit.WRITE,
      });
      
      mockUserRepository.findOneByField.mockResolvedValue({
        id: 'user-1',
        roles: [{ id: 'role-1', isAdmin: true }],
      });

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
      
      expect(mockGetUserVmPermissionsUseCase.execute).not.toHaveBeenCalled();
    });

    it('should check permissions normally when user is not admin', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });
      
      mockUserRepository.findOneByField.mockResolvedValue({
        id: 'user-1',
        roles: [{ id: 'role-1', isAdmin: false }],
      });
      
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [createMockPermissionServerDto({ bitmask: 1 })],
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(true);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
      
      expect(mockGetUserServerPermissionsUseCase.execute).toHaveBeenCalledWith('user-1');
    });

    it('should check permissions when user has no roles', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });
      
      mockUserRepository.findOneByField.mockResolvedValue({
        id: 'user-1',
        roles: [],
      });
      
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [createMockPermissionServerDto({ bitmask: 1 })],
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(true);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });

    it('should handle when user is not found', async () => {
      mockReflector.get.mockReturnValue({
        type: 'server',
        requiredBit: PermissionBit.READ,
      });
      
      mockUserRepository.findOneByField.mockResolvedValue(null);
      
      mockGetUserServerPermissionsUseCase.execute.mockResolvedValue({
        permissionServers: [createMockPermissionServerDto({ bitmask: 1 })],
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(true);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });
  });

  describe('Server Permissions', () => {
    beforeEach(() => {
      mockUserRepository.findOneByField.mockResolvedValue({
        id: 'user-1',
        roles: [{ id: 'role-1', isAdmin: false }],
      });
    });

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

  describe('VM Permissions', () => {
    beforeEach(() => {
      mockUserRepository.findOneByField.mockResolvedValue({
        id: 'user-1',
        roles: [{ id: 'role-1', isAdmin: false }],
      });
    });

    it('should allow access for vm permission (permission OK)', async () => {
      mockReflector.get.mockReturnValue({
        type: 'vm',
        requiredBit: PermissionBit.WRITE,
      });
      mockGetUserVmPermissionsUseCase.execute.mockResolvedValue({
        permissionVms: [createMockPermissionVmDto({ bitmask: 2 })],
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(true);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });

    it('should deny if permission list for vm is missing required bit', async () => {
      mockReflector.get.mockReturnValue({
        type: 'vm',
        requiredBit: PermissionBit.WRITE,
      });
      mockGetUserVmPermissionsUseCase.execute.mockResolvedValue({
        permissionVms: [createMockPermissionVmDto({ bitmask: 1 })], // READ only
      });
      jest.spyOn(PermissionUtils, 'has').mockReturnValue(false);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });

    it('should allow access when user has multiple vm permissions and at least one matches', async () => {
      mockReflector.get.mockReturnValue({
        type: 'vm',
        requiredBit: PermissionBit.DELETE,
      });
      mockGetUserVmPermissionsUseCase.execute.mockResolvedValue({
        permissionVms: [
          createMockPermissionVmDto({ bitmask: 1 }), // READ only
          createMockPermissionVmDto({ bitmask: 4 }), // DELETE
          createMockPermissionVmDto({ bitmask: 2 }), // WRITE only
        ],
      });
      jest
        .spyOn(PermissionUtils, 'has')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });
  });

  describe('Error Cases', () => {
    beforeEach(() => {
      mockUserRepository.findOneByField.mockResolvedValue({
        id: 'user-1',
        roles: [{ id: 'role-1', isAdmin: false }],
      });
    });

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

    it('should throw if vm use case returns undefined', async () => {
      mockReflector.get.mockReturnValue({
        type: 'vm',
        requiredBit: PermissionBit.READ,
      });
      mockGetUserVmPermissionsUseCase.execute.mockResolvedValue(undefined);

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
    beforeEach(() => {
      mockUserRepository.findOneByField.mockResolvedValue({
        id: 'user-1',
        roles: [{ id: 'role-1', isAdmin: false }],
      });
    });

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

    it('should handle vm use case throwing an error', async () => {
      mockReflector.get.mockReturnValue({
        type: 'vm',
        requiredBit: PermissionBit.WRITE,
      });
      mockGetUserVmPermissionsUseCase.execute.mockRejectedValue(
        new Error('User not found'),
      );

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        'User not found',
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
    beforeEach(() => {
      mockUserRepository.findOneByField.mockResolvedValue({
        id: 'user-1',
        roles: [{ id: 'role-1', isAdmin: false }],
      });
    });

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

    it('should handle vm permissions with null/undefined bitmask gracefully', async () => {
      mockReflector.get.mockReturnValue({
        type: 'vm',
        requiredBit: PermissionBit.READ,
      });

      mockGetUserVmPermissionsUseCase.execute.mockResolvedValue({
        permissionVms: [
          { bitmask: null }, // null bitmask
          { bitmask: undefined }, // undefined bitmask
          { bitmask: 1 }, // valid bitmask
        ],
      });
      jest
        .spyOn(PermissionUtils, 'has')
        .mockReturnValueOnce(false) // null bitmask
        .mockReturnValueOnce(false) // undefined bitmask
        .mockReturnValueOnce(true); // valid bitmask

      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as any)).resolves.toBe(true);
    });
  });
});
