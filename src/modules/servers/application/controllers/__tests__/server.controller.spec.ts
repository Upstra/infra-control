import { Test, TestingModule } from '@nestjs/testing';
import { ServerController } from '../server.controller';
import {
  CreateServerUseCase,
  DeleteServerUseCase,
  GetAllServersUseCase,
  GetServerByIdUseCase,
  GetServerByIdWithPermissionCheckUseCase,
  GetUserServersUseCase,
  UpdateServerUseCase,
} from '@/modules/servers/application/use-cases';
import { createMockServerDto } from '@/modules/servers/__mocks__/servers.mock';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { PermissionGuard } from '@/core/guards/permission.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { GetUserWithRoleUseCase } from '@/modules/users/application/use-cases';
import { Reflector } from '@nestjs/core';

describe('ServerController', () => {
  let controller: ServerController;
  let getAllServersUseCase: jest.Mocked<GetAllServersUseCase>;
  let getServerByIdUseCase: jest.Mocked<GetServerByIdUseCase>;
  let createServerUseCase: jest.Mocked<CreateServerUseCase>;
  let updateServerUseCase: jest.Mocked<UpdateServerUseCase>;
  let deleteServerUseCase: jest.Mocked<DeleteServerUseCase>;
  let getUserServersUseCase: jest.Mocked<GetUserServersUseCase>;
  let getServerByIdWithPermissionCheckUseCase: jest.Mocked<GetServerByIdWithPermissionCheckUseCase>;

  beforeEach(async () => {
    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockPermissionGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockRoleGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockGetUserWithRoleUseCase = {
      execute: jest.fn(),
    };

    const mockReflector = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    };

    getAllServersUseCase = { execute: jest.fn() } as any;
    getServerByIdUseCase = { execute: jest.fn() } as any;
    createServerUseCase = { execute: jest.fn() } as any;
    updateServerUseCase = { execute: jest.fn() } as any;
    deleteServerUseCase = { execute: jest.fn() } as any;
    getUserServersUseCase = { execute: jest.fn() } as any;
    getServerByIdWithPermissionCheckUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerController],
      providers: [
        { provide: GetAllServersUseCase, useValue: getAllServersUseCase },
        { provide: GetServerByIdUseCase, useValue: getServerByIdUseCase },
        { provide: CreateServerUseCase, useValue: createServerUseCase },
        { provide: UpdateServerUseCase, useValue: updateServerUseCase },
        { provide: DeleteServerUseCase, useValue: deleteServerUseCase },
        { provide: GetUserServersUseCase, useValue: getUserServersUseCase },
        {
          provide: GetServerByIdWithPermissionCheckUseCase,
          useValue: getServerByIdWithPermissionCheckUseCase,
        },

        {
          provide: GetUserWithRoleUseCase,
          useValue: mockGetUserWithRoleUseCase,
        },
        { provide: Reflector, useValue: mockReflector },
      ],
    })

      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionGuard)
      .useValue(mockPermissionGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get(ServerController);
  });

  describe('getAllServers', () => {
    it('should return all servers', async () => {
      const dto = createMockServerDto();
      getAllServersUseCase.execute.mockResolvedValue([dto]);

      const result = await controller.getAllServers();

      expect(result).toEqual([dto]);
      expect(getAllServersUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('getServerById', () => {
    it('should return a server by id', async () => {
      const dto = createMockServerDto();
      const user: JwtPayload = {
        userId: 'user-uuid',
        email: 'john.doe@example.com',
      };
      getServerByIdWithPermissionCheckUseCase.execute.mockResolvedValue(dto);

      const result = await controller.getServerById('server-uuid', user);

      expect(result).toEqual(dto);
      expect(
        getServerByIdWithPermissionCheckUseCase.execute,
      ).toHaveBeenCalledWith('server-uuid', 'user-uuid');
    });

    it('should throw if server is not found (permission check route)', async () => {
      const user: JwtPayload = {
        userId: 'user-uuid',
        email: 'john.doe@example.com',
      };

      getServerByIdWithPermissionCheckUseCase.execute.mockRejectedValue(
        new Error('Server not found'),
      );

      await expect(
        controller.getServerById('nonexistent-id', user),
      ).rejects.toThrow('Server not found');
    });
  });

  describe('createServer', () => {
    it('should create a server', async () => {
      const dto = createMockServerDto();
      createServerUseCase.execute.mockResolvedValue(dto);

      const result = await controller.createServer({
        ...dto,
        ilo: undefined,
      } as any);

      expect(result).toEqual(dto);
      expect(createServerUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw if server creation fails', async () => {
      createServerUseCase.execute.mockRejectedValue(
        new Error('Server already exists'),
      );

      await expect(
        controller.createServer({
          name: 'Duplicate Server',
        } as any),
      ).rejects.toThrow('Server already exists');
    });
  });

  describe('updateServer', () => {
    it('should update a server', async () => {
      const dto = createMockServerDto();
      updateServerUseCase.execute.mockResolvedValue(dto);

      const result = await controller.updateServer('server-uuid', {
        name: 'Updated',
      });

      expect(result).toEqual(dto);
      expect(updateServerUseCase.execute).toHaveBeenCalledWith('server-uuid', {
        name: 'Updated',
      });
    });

    it('should throw if update fails (e.g., server not found)', async () => {
      updateServerUseCase.execute.mockRejectedValue(
        new Error('Update failed: server not found'),
      );

      await expect(
        controller.updateServer('invalid-id', { name: 'Updated' }),
      ).rejects.toThrow('Update failed: server not found');
    });
  });

  describe('deleteServer', () => {
    it('should delete a server', async () => {
      deleteServerUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.deleteServer('server-uuid');

      expect(result).toBeUndefined();
      expect(deleteServerUseCase.execute).toHaveBeenCalledWith('server-uuid');
    });
  });

  describe('getMyServers', () => {
    it('should return servers accessible to the user', async () => {
      const dto = createMockServerDto();
      const user: JwtPayload = {
        userId: 'user-uuid',
        email: 'john.doe@example.com',
      };

      getUserServersUseCase.execute.mockResolvedValue([dto]);

      const result = await controller.getMyServers(user);

      expect(result).toEqual([dto]);
      expect(getUserServersUseCase.execute).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('getServerByIdAdmin', () => {
    it('should return a server by id (admin)', async () => {
      const dto = createMockServerDto();
      getServerByIdUseCase.execute.mockResolvedValue(dto);

      const result = await controller.getServerByIdAdmin('server-uuid');

      expect(result).toEqual(dto);
      expect(getServerByIdUseCase.execute).toHaveBeenCalledWith('server-uuid');
    });

    it('should throw if admin tries to fetch nonexistent server', async () => {
      getServerByIdUseCase.execute.mockRejectedValue(
        new Error('Server not found'),
      );

      await expect(
        controller.getServerByIdAdmin('nonexistent-id'),
      ).rejects.toThrow('Server not found');
    });
  });

  describe('Guard Integration Tests', () => {
    it('should handle guard permission denials gracefully', async () => {
      const user: JwtPayload = {
        userId: 'user-uuid',
        email: 'blocked@example.com',
      };

      getUserServersUseCase.execute.mockRejectedValue(new Error('Forbidden'));

      await expect(controller.getMyServers(user)).rejects.toThrow('Forbidden');
    });
  });
});
