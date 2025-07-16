import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CheckServerPermissionUseCase } from './check-server-permission.use-case';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';
import { Server } from '../../domain/entities/server.entity';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';

jest.mock('@/modules/permissions/application/utils/permission-resolver.util');

describe('CheckServerPermissionUseCase', () => {
  let useCase: CheckServerPermissionUseCase;
  let userRepo: jest.Mocked<UserRepositoryInterface>;
  let permissionRepo: jest.Mocked<PermissionServerRepositoryInterface>;
  let serverRepo: jest.Mocked<ServerRepositoryInterface>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckServerPermissionUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
        {
          provide: 'PermissionServerRepositoryInterface',
          useValue: {},
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CheckServerPermissionUseCase>(
      CheckServerPermissionUseCase,
    );
    userRepo = module.get('UserRepositoryInterface');
    permissionRepo = module.get('PermissionServerRepositoryInterface');
    serverRepo = module.get('ServerRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const serverId = 'server-123';
    const userId = 'user-123';
    const permission = PermissionBit.READ;

    it('should return hasPermission: true when user has the required permission', async () => {
      const mockServer = { id: serverId } as Server;
      const mockRole = { id: 'role-123' } as Role;
      const mockUser = {
        id: userId,
        roles: [mockRole],
      } as User;

      const mockPermission = new PermissionServer();
      mockPermission.serverId = serverId;
      mockPermission.bitmask = PermissionBit.READ | PermissionBit.WRITE;

      serverRepo.findOneByField.mockResolvedValue(mockServer);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      (
        PermissionResolver.resolveServerPermissions as jest.Mock
      ).mockResolvedValue([mockPermission]);

      const result = await useCase.execute(serverId, userId, permission);

      expect(result).toEqual({
        hasPermission: true,
        userId,
        resourceId: serverId,
        resourceType: 'server',
        permission,
      });

      expect(serverRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: serverId,
      });
      expect(userRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: userId,
        relations: ['roles'],
      });
      expect(PermissionResolver.resolveServerPermissions).toHaveBeenCalledWith(
        permissionRepo,
        ['role-123'],
      );
    });

    it('should return hasPermission: false when user does not have the required permission', async () => {
      const mockServer = { id: serverId } as Server;
      const mockRole = { id: 'role-123' } as Role;
      const mockUser = {
        id: userId,
        roles: [mockRole],
      } as User;

      const mockPermission = new PermissionServer();
      mockPermission.serverId = 'other-server';
      mockPermission.bitmask = PermissionBit.READ;

      serverRepo.findOneByField.mockResolvedValue(mockServer);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      (
        PermissionResolver.resolveServerPermissions as jest.Mock
      ).mockResolvedValue([mockPermission]);

      const result = await useCase.execute(serverId, userId, permission);

      expect(result).toEqual({
        hasPermission: false,
        userId,
        resourceId: serverId,
        resourceType: 'server',
        permission,
      });
    });

    it('should return hasPermission: false when user has no roles', async () => {
      const mockServer = { id: serverId } as Server;
      const mockUser = {
        id: userId,
        roles: [],
      } as User;

      serverRepo.findOneByField.mockResolvedValue(mockServer);
      userRepo.findOneByField.mockResolvedValue(mockUser);

      const result = await useCase.execute(serverId, userId, permission);

      expect(result).toEqual({
        hasPermission: false,
        userId,
        resourceId: serverId,
        resourceType: 'server',
        permission,
      });

      expect(
        PermissionResolver.resolveServerPermissions,
      ).not.toHaveBeenCalled();
    });

    it('should return hasPermission: false when user is not found', async () => {
      const mockServer = { id: serverId } as Server;

      serverRepo.findOneByField.mockResolvedValue(mockServer);
      userRepo.findOneByField.mockResolvedValue(null);

      const result = await useCase.execute(serverId, userId, permission);

      expect(result).toEqual({
        hasPermission: false,
        userId,
        resourceId: serverId,
        resourceType: 'server',
        permission,
      });
    });

    it('should throw NotFoundException when server does not exist', async () => {
      serverRepo.findOneByField.mockResolvedValue(null);

      await expect(
        useCase.execute(serverId, userId, permission),
      ).rejects.toThrow(NotFoundException);

      expect(serverRepo.findOneByField).toHaveBeenCalledWith({
        field: 'id',
        value: serverId,
      });
      expect(userRepo.findOneByField).not.toHaveBeenCalled();
    });

    it('should handle global permissions correctly', async () => {
      const mockServer = { id: serverId } as Server;
      const mockRole = { id: 'role-123' } as Role;
      const mockUser = {
        id: userId,
        roles: [mockRole],
      } as User;

      const mockGlobalPermission = new PermissionServer();
      mockGlobalPermission.serverId = undefined;
      mockGlobalPermission.bitmask = PermissionBit.READ | PermissionBit.WRITE;

      serverRepo.findOneByField.mockResolvedValue(mockServer);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      (
        PermissionResolver.resolveServerPermissions as jest.Mock
      ).mockResolvedValue([mockGlobalPermission]);

      const result = await useCase.execute(serverId, userId, permission);

      expect(result).toEqual({
        hasPermission: true,
        userId,
        resourceId: serverId,
        resourceType: 'server',
        permission,
      });
    });

    it('should check for specific permission bit correctly', async () => {
      const mockServer = { id: serverId } as Server;
      const mockRole = { id: 'role-123' } as Role;
      const mockUser = {
        id: userId,
        roles: [mockRole],
      } as User;

      const mockPermission = new PermissionServer();
      mockPermission.serverId = serverId;
      mockPermission.bitmask = PermissionBit.READ | PermissionBit.WRITE;

      serverRepo.findOneByField.mockResolvedValue(mockServer);
      userRepo.findOneByField.mockResolvedValue(mockUser);
      (
        PermissionResolver.resolveServerPermissions as jest.Mock
      ).mockResolvedValue([mockPermission]);

      const deleteResult = await useCase.execute(
        serverId,
        userId,
        PermissionBit.DELETE,
      );

      expect(deleteResult.hasPermission).toBe(false);

      const readResult = await useCase.execute(
        serverId,
        userId,
        PermissionBit.READ,
      );

      expect(readResult.hasPermission).toBe(true);
    });
  });
});
