import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

import { createMockPermissionServer } from '@/modules/permissions/__mocks__/permissions.mock';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { buildBitmask } from '@/modules/permissions/__mocks__/permission-bitmask.helper';
import { GetServerByIdWithPermissionCheckUseCase } from '../get-server-by-id-with-permission-check.use-case';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';
import { ServerResponseDto } from '../../dto/server.response.dto';

describe('GetServerByIdWithPermissionCheckUseCase', () => {
  let useCase: GetServerByIdWithPermissionCheckUseCase;
  let userRepo: jest.Mocked<UserRepositoryInterface>;
  let permissionRepo: jest.Mocked<PermissionServerRepositoryInterface>;
  let serverRepo: jest.Mocked<ServerRepositoryInterface>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetServerByIdWithPermissionCheckUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
        {
          provide: 'PermissionServerRepositoryInterface',
          useValue: {
            findAllByField: jest.fn(),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetServerByIdWithPermissionCheckUseCase>(
      GetServerByIdWithPermissionCheckUseCase,
    );
    userRepo = module.get('UserRepositoryInterface');
    permissionRepo = module.get('PermissionServerRepositoryInterface');
    serverRepo = module.get('ServerRepositoryInterface');
  });

  describe('execute', () => {
    const userId = 'user-123';
    const serverId = 'server-456';
    const roleId = 'role-789';

    describe('Admin functionality', () => {
      it('should allow admin users to access any server without permission check', async () => {
        const mockAdminRole = createMockRole({ id: roleId, name: 'Admin', isAdmin: true });
        const mockAdminUser = createMockUser({
          id: userId,
          roleId: roleId,
          roles: [mockAdminRole],
        });

        const mockServer = createMockServer({
          id: serverId,
          name: 'Test Server',
          ip: '192.168.1.1',
        });

        userRepo.findOneByField.mockResolvedValue(mockAdminUser);
        serverRepo.findOneByField.mockResolvedValue(mockServer);

        const result = await useCase.execute(serverId, userId);

        expect(result).toBeInstanceOf(ServerResponseDto);
        expect(result.id).toBe(serverId);
        expect(result.name).toBe('Test Server');

        expect(permissionRepo.findAllByField).not.toHaveBeenCalled();
      });

      it('should still return NotFoundException when server does not exist for admin', async () => {
        const mockAdminRole = createMockRole({ id: roleId, name: 'Admin', isAdmin: true });
        const mockAdminUser = createMockUser({
          id: userId,
          roleId: roleId,
          roles: [mockAdminRole],
        });

        userRepo.findOneByField.mockResolvedValue(mockAdminUser);
        serverRepo.findOneByField.mockResolvedValue(null);

        await expect(useCase.execute(serverId, userId)).rejects.toThrow(
          new NotFoundException('Server not found'),
        );

        expect(permissionRepo.findAllByField).not.toHaveBeenCalled();
      });

      it('should handle user with mixed admin and non-admin roles', async () => {
        const adminRole = createMockRole({ id: 'admin-role', name: 'Admin', isAdmin: true });
        const userRole = createMockRole({ id: 'user-role', name: 'User', isAdmin: false });
        const mockUser = createMockUser({
          id: userId,
          roleId: roleId,
          roles: [userRole, adminRole],
        });

        const mockServer = createMockServer({
          id: serverId,
          name: 'Test Server',
        });

        userRepo.findOneByField.mockResolvedValue(mockUser);
        serverRepo.findOneByField.mockResolvedValue(mockServer);

        const result = await useCase.execute(serverId, userId);

        expect(result).toBeInstanceOf(ServerResponseDto);
        expect(result.id).toBe(serverId);
        expect(permissionRepo.findAllByField).not.toHaveBeenCalled();
      });
    });

    it('should successfully return server when user has READ permission', async () => {
      const mockRole = createMockRole({ id: roleId, name: 'User', isAdmin: false });
      const mockUser = createMockUser({
        id: userId,
        roleId: roleId,
        roles: [mockRole],
      });

      const mockPermissions = [
        createMockPermissionServer({
          roleId: roleId,
          serverId: serverId,
          bitmask: buildBitmask([PermissionBit.READ]),
        }),
        createMockPermissionServer({
          roleId: roleId,
          serverId: 'other-server',
          bitmask: buildBitmask([PermissionBit.WRITE]),
        }),
      ];

      const mockServer = createMockServer({
        id: serverId,
        name: 'Test Server',
        ip: '192.168.1.1',
      });

      userRepo.findOneByField.mockResolvedValue(mockUser);
      permissionRepo.findAllByField.mockResolvedValue(mockPermissions);
      serverRepo.findOneByField.mockResolvedValue(mockServer);

      const result = await useCase.execute(serverId, userId);

      expect(result).toBeInstanceOf(ServerResponseDto);
      expect(result.id).toBe(serverId);
      expect(result.name).toBe('Test Server');

      expect(userRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: userId,
        relations: ['roles'],
      });

      expect(permissionRepo.findAllByField).toHaveBeenCalledWith({
        field: 'roleId',
        value: roleId,
      });

      expect(serverRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: serverId,
        relations: ['ilo'],
      });
    });

    it('should throw ForbiddenException when user has no role', async () => {
      const mockUser = createMockUser({
        id: userId,
        roleId: null,
        role: null,
      });

      userRepo.findOneByField.mockResolvedValue(mockUser);

      await expect(useCase.execute(serverId, userId)).rejects.toThrow(
        new ForbiddenException('User has no role assigned'),
      );

      expect(permissionRepo.findAllByField).not.toHaveBeenCalled();
      expect(serverRepo.findOneByField).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user not found', async () => {
      userRepo.findOneByField.mockResolvedValue(null);

      await expect(useCase.execute(serverId, userId)).rejects.toThrow(
        new ForbiddenException('User has no role assigned'),
      );
    });

    it('should throw ForbiddenException when user has no READ permission for the server', async () => {
      const mockRole = createMockRole({ id: roleId, name: 'User', isAdmin: false });
      const mockUser = createMockUser({
        id: userId,
        roleId: roleId,
        roles: [mockRole],
      });

      const mockPermissions = [
        createMockPermissionServer({
          roleId: roleId,
          serverId: 'other-server-1',
          bitmask: buildBitmask([PermissionBit.READ]),
        }),
        createMockPermissionServer({
          roleId: roleId,
          serverId: 'other-server-2',
          bitmask: buildBitmask([PermissionBit.READ]),
        }),
        createMockPermissionServer({
          roleId: roleId,
          serverId: serverId,
          bitmask: buildBitmask([PermissionBit.WRITE]),
        }),
      ];

      userRepo.findOneByField.mockResolvedValue(mockUser);
      permissionRepo.findAllByField.mockResolvedValue(mockPermissions);

      await expect(useCase.execute(serverId, userId)).rejects.toThrow(
        new ForbiddenException('Access denied to this server'),
      );

      expect(serverRepo.findOneByField).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when server does not exist', async () => {
      const mockRole = createMockRole({ id: roleId, name: 'User', isAdmin: false });
      const mockUser = createMockUser({
        id: userId,
        roleId: roleId,
        roles: [mockRole],
      });

      const mockPermissions = [
        createMockPermissionServer({
          roleId: roleId,
          serverId: serverId,
          bitmask: buildBitmask([PermissionBit.READ]),
        }),
      ];

      userRepo.findOneByField.mockResolvedValue(mockUser);
      permissionRepo.findAllByField.mockResolvedValue(mockPermissions);
      serverRepo.findOneByField.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(serverId, userId)).rejects.toThrow(
        new NotFoundException('Server not found'),
      );
    });

    it('should handle user with multiple READ permissions including the requested server', async () => {
      const mockRole = createMockRole({ id: roleId, name: 'User', isAdmin: false });
      const mockUser = createMockUser({
        id: userId,
        roleId: roleId,
        roles: [mockRole],
      });

      const mockPermissions = [
        createMockPermissionServer({
          roleId: roleId,
          serverId: 'server-1',
          bitmask: buildBitmask([PermissionBit.READ]),
        }),
        createMockPermissionServer({
          roleId: roleId,
          serverId: serverId,
          bitmask: buildBitmask([PermissionBit.READ]),
        }),
        createMockPermissionServer({
          roleId: roleId,
          serverId: serverId,
          bitmask: buildBitmask([PermissionBit.WRITE]),
        }),
        createMockPermissionServer({
          roleId: roleId,
          serverId: 'server-3',
          bitmask: buildBitmask([PermissionBit.READ]),
        }),
      ];

      const mockServer = createMockServer({
        id: serverId,
        name: 'Test Server',
      });

      userRepo.findOneByField.mockResolvedValue(mockUser);
      permissionRepo.findAllByField.mockResolvedValue(mockPermissions);
      serverRepo.findOneByField.mockResolvedValue(mockServer);

      const result = await useCase.execute(serverId, userId);

      expect(result).toBeInstanceOf(ServerResponseDto);
      expect(result.id).toBe(serverId);
    });

    it('should throw ForbiddenException when user has empty permissions', async () => {
      const mockRole = createMockRole({ id: roleId, name: 'Guest', isAdmin: false });
      const mockUser = createMockUser({
        id: userId,
        roleId: roleId,
        roles: [mockRole],
      });

      userRepo.findOneByField.mockResolvedValue(mockUser);
      permissionRepo.findAllByField.mockResolvedValue([]);

      await expect(useCase.execute(serverId, userId)).rejects.toThrow(
        new ForbiddenException('Access denied to this server'),
      );

      expect(serverRepo.findOneByField).not.toHaveBeenCalled();
    });

    it('should handle permissions with null serverId correctly', async () => {
      const mockRole = createMockRole({ id: roleId, name: 'User', isAdmin: false });
      const mockUser = createMockUser({
        id: userId,
        roleId: roleId,
        roles: [mockRole],
      });

      const mockPermissions = [
        createMockPermissionServer({
          roleId: roleId,
          serverId: null,
          bitmask: buildBitmask([PermissionBit.READ]),
        }),
        createMockPermissionServer({
          roleId: roleId,
          serverId: 'other-server',
          bitmask: buildBitmask([PermissionBit.READ]),
        }),
      ];

      userRepo.findOneByField.mockResolvedValue(mockUser);
      permissionRepo.findAllByField.mockResolvedValue(mockPermissions);

      await expect(useCase.execute(serverId, userId)).rejects.toThrow(
        new ForbiddenException('Access denied to this server'),
      );
    });

    it('should handle user with combined READ and WRITE permissions', async () => {
      const mockRole = createMockRole({ id: roleId, name: 'PowerUser', isAdmin: false });
      const mockUser = createMockUser({
        id: userId,
        roleId: roleId,
        roles: [mockRole],
      });

      const mockPermissions = [
        createMockPermissionServer({
          roleId: roleId,
          serverId: serverId,
          bitmask: buildBitmask([PermissionBit.READ, PermissionBit.WRITE]),
        }),
      ];

      const mockServer = createMockServer({
        id: serverId,
        name: 'Test Server',
      });

      userRepo.findOneByField.mockResolvedValue(mockUser);
      permissionRepo.findAllByField.mockResolvedValue(mockPermissions);
      serverRepo.findOneByField.mockResolvedValue(mockServer);

      const result = await useCase.execute(serverId, userId);

      expect(result).toBeInstanceOf(ServerResponseDto);
      expect(result.id).toBe(serverId);
    });
  });
});
