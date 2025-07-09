import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from '../role.controller';
import {
  CreateRoleUseCase,
  DeleteRoleUseCase,
  GetAllRolesUseCase,
  GetRoleByIdUseCase,
  GetRoleListUseCase,
  UpdateRoleUseCase,
  GetUsersByRoleUseCase,
  UpdateUserRoleUseCase,
  UpdateUserRolesUseCase,
} from '../../use-cases';
import { RoleCreationDto, RoleResponseDto } from '../../dto';
import { AdminRoleCreationDto } from '../../dto/role.creation.dto';
import { RoleUpdateDto } from '../../dto/role.update.dto';
import { RoleGuard } from '@/core/guards';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';

describe('RoleController', () => {
  let controller: RoleController;
  let createRoleUseCase: jest.Mocked<CreateRoleUseCase>;
  let getAllRolesUseCase: jest.Mocked<GetAllRolesUseCase>;
  let getRoleListUseCase: jest.Mocked<GetRoleListUseCase>;
  let getRoleByIdUseCase: jest.Mocked<GetRoleByIdUseCase>;
  let updateRoleUseCase: jest.Mocked<UpdateRoleUseCase>;
  let deleteRoleUseCase: jest.Mocked<DeleteRoleUseCase>;
  let getUsersByRoleUseCase: jest.Mocked<GetUsersByRoleUseCase>;
  let updateUserRoleUseCase: jest.Mocked<UpdateUserRoleUseCase>;
  let updateUserRolesUseCase: jest.Mocked<UpdateUserRolesUseCase>;

  beforeEach(async () => {
    createRoleUseCase = { execute: jest.fn() } as any;
    getAllRolesUseCase = { execute: jest.fn() } as any;
    getRoleListUseCase = { execute: jest.fn() } as any;
    getRoleByIdUseCase = { execute: jest.fn() } as any;
    updateRoleUseCase = { execute: jest.fn() } as any;
    deleteRoleUseCase = { execute: jest.fn() } as any;
    getUsersByRoleUseCase = { execute: jest.fn() } as any;
    updateUserRoleUseCase = { execute: jest.fn() } as any;
    updateUserRolesUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        { provide: CreateRoleUseCase, useValue: createRoleUseCase },
        { provide: GetRoleListUseCase, useValue: getRoleListUseCase },
        { provide: GetAllRolesUseCase, useValue: getAllRolesUseCase },
        { provide: GetRoleByIdUseCase, useValue: getRoleByIdUseCase },
        { provide: UpdateRoleUseCase, useValue: updateRoleUseCase },
        { provide: DeleteRoleUseCase, useValue: deleteRoleUseCase },
        { provide: GetUsersByRoleUseCase, useValue: getUsersByRoleUseCase },
        { provide: UpdateUserRoleUseCase, useValue: updateUserRoleUseCase },
        { provide: UpdateUserRolesUseCase, useValue: updateUserRolesUseCase },
      ],
    })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<RoleController>(RoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoles', () => {
    it('should return paginated roles', async () => {
      const mock = { items: [], total: 0 } as any;
      getRoleListUseCase.execute.mockResolvedValue(mock);
      const result = await controller.getRoles('1', '5');
      expect(result).toBe(mock);
      expect(getRoleListUseCase.execute).toHaveBeenCalledWith(1, 5);
    });

    it('should use default pagination values', async () => {
      const mock = { items: [], total: 0 } as any;
      getRoleListUseCase.execute.mockResolvedValue(mock);
      const result = await controller.getRoles();
      expect(result).toBe(mock);
      expect(getRoleListUseCase.execute).toHaveBeenCalledWith(1, 10);
    });

    it('should propagate errors', async () => {
      getRoleListUseCase.execute.mockRejectedValue(new Error('fail'));
      await expect(controller.getRoles()).rejects.toThrow('fail');
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const roles = [
        new RoleResponseDto(createMockRole({ name: 'ADMIN' })),
        new RoleResponseDto(createMockRole({ name: 'GUEST' })),
      ];
      getAllRolesUseCase.execute.mockResolvedValue(roles);

      const result = await controller.getAllRoles();
      expect(result).toEqual(roles);
      expect(getAllRolesUseCase.execute).toHaveBeenCalled();
    });

    it('should propagate error from usecase', async () => {
      getAllRolesUseCase.execute.mockRejectedValue(new Error('boom'));
      await expect(controller.getAllRoles()).rejects.toThrow('boom');
    });
  });

  describe('getRoleById', () => {
    it('should return a role by id', async () => {
      const role = new RoleResponseDto(
        createMockRole({ id: 'uuid', name: 'ADMIN' }),
      );
      getRoleByIdUseCase.execute.mockResolvedValue(role);

      const result = await controller.getRoleById('uuid');
      expect(result).toEqual(role);
      expect(getRoleByIdUseCase.execute).toHaveBeenCalledWith('uuid');
    });

    it('should propagate error if usecase throws', async () => {
      getRoleByIdUseCase.execute.mockRejectedValue(new Error('Not found'));

      await expect(controller.getRoleById('bad-id')).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('createRole', () => {
    it('should create a role', async () => {
      const dto: RoleCreationDto = { name: 'NEW_ROLE' };
      const role = new RoleResponseDto(createMockRole({ name: 'NEW_ROLE' }));
      createRoleUseCase.execute.mockResolvedValue(role);

      const result = await controller.createRole(dto);
      expect(result).toEqual(role);
      expect(createRoleUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('should propagate error from usecase', async () => {
      createRoleUseCase.execute.mockRejectedValue(new Error('fail'));
      await expect(controller.createRole({ name: 'A' })).rejects.toThrow(
        'fail',
      );
    });
  });

  describe('createAdminRole', () => {
    it('should create admin role', async () => {
      const dto: AdminRoleCreationDto = {
        name: 'ADMIN',
        isAdmin: true,
        canCreateServer: true,
      };
      const role = new RoleResponseDto(createMockRole({ name: 'ADMIN' }));
      createRoleUseCase.execute.mockResolvedValue(role);

      const result = await controller.createAdminRole(dto);
      expect(result).toEqual(role);
      expect(createRoleUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const dto: RoleUpdateDto = { name: 'UPD_ROLE' };
      const role = new RoleResponseDto(createMockRole({ name: 'UPD_ROLE' }));
      updateRoleUseCase.execute.mockResolvedValue(role);

      const result = await controller.updateRole('uuid', dto);
      expect(result).toEqual(role);
      expect(updateRoleUseCase.execute).toHaveBeenCalledWith('uuid', dto);
    });

    it('should propagate errors', async () => {
      updateRoleUseCase.execute.mockRejectedValue(new Error('fail'));
      await expect(
        controller.updateRole('uuid', { name: 'x' }),
      ).rejects.toThrow('fail');
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      deleteRoleUseCase.execute.mockResolvedValue(undefined);

      await expect(controller.deleteRole('uuid')).resolves.toBeUndefined();
      expect(deleteRoleUseCase.execute).toHaveBeenCalledWith('uuid');
    });

    it('should propagate error from usecase', async () => {
      deleteRoleUseCase.execute.mockRejectedValue(new Error('fail'));
      await expect(controller.deleteRole('uuid')).rejects.toThrow('fail');
    });
  });

  describe('getUsersByRole', () => {
    it('should return users of role', async () => {
      const mockUser = createMockUser({ id: 'u1' });
      const userWithPresence = Object.assign(new UserResponseDto(mockUser), {
        isOnline: true,
      });
      const users = [userWithPresence];
      getUsersByRoleUseCase.execute.mockResolvedValue(users);

      const result = await controller.getUsersByRole('role1');
      expect(result).toEqual(users);
      expect(getUsersByRoleUseCase.execute).toHaveBeenCalledWith('role1');
    });

    it('should propagate errors', async () => {
      getUsersByRoleUseCase.execute.mockRejectedValue(new Error('fail'));
      await expect(controller.getUsersByRole('r1')).rejects.toThrow('fail');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const user = new UserResponseDto(createMockUser({ id: 'u1' }));
      updateUserRoleUseCase.execute.mockResolvedValue(user);

      const mockCurrentUser = {
        userId: 'admin-123',
        email: 'admin@example.com',
      };
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      const result = await controller.updateUserRole(
        'u1',
        { roleId: 'r2' },
        mockCurrentUser,
        mockReq,
      );
      expect(result).toEqual(user);
      expect(updateUserRoleUseCase.execute).toHaveBeenCalledWith(
        'u1',
        'r2',
        'admin-123',
        expect.any(Object),
      );
    });

    it('should propagate errors', async () => {
      updateUserRoleUseCase.execute.mockRejectedValue(new Error('fail'));
      const mockCurrentUser = {
        userId: 'admin-123',
        email: 'admin@example.com',
      };
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      await expect(
        controller.updateUserRole(
          'u1',
          { roleId: null },
          mockCurrentUser,
          mockReq,
        ),
      ).rejects.toThrow('fail');
    });

    it('should handle multiple roles assignment', async () => {
      const user = new UserResponseDto(createMockUser({ id: 'u1' }));
      updateUserRolesUseCase.execute.mockResolvedValue(user);
      const mockCurrentUser = {
        userId: 'admin-123',
        email: 'admin@example.com',
      };
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      const result = await controller.updateUserRole(
        'u1',
        { roleIds: ['r1', 'r2', 'r3'] },
        mockCurrentUser,
        mockReq,
      );
      expect(result).toEqual(user);
      expect(updateUserRolesUseCase.execute).toHaveBeenCalledWith(
        'u1',
        undefined,
        ['r1', 'r2', 'r3'],
        'admin-123',
        expect.objectContaining({
          ipAddress: '127.0.0.1',
          userAgent: 'Test-Agent',
        }),
      );
    });

    it('should handle single role toggle', async () => {
      const user = new UserResponseDto(createMockUser({ id: 'u1' }));
      updateUserRoleUseCase.execute.mockResolvedValue(user);
      const mockCurrentUser = {
        userId: 'admin-123',
        email: 'admin@example.com',
      };
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      const result = await controller.updateUserRole(
        'u1',
        { roleId: 'r2' },
        mockCurrentUser,
        mockReq,
      );
      expect(result).toEqual(user);
      expect(updateUserRoleUseCase.execute).toHaveBeenCalledWith(
        'u1',
        'r2',
        'admin-123',
        expect.objectContaining({
          ipAddress: '127.0.0.1',
          userAgent: 'Test-Agent',
        }),
      );
      expect(updateUserRolesUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
