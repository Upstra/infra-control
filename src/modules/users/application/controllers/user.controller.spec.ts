import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';

import { GetMeUseCase } from '../use-cases/get-me.use-case';
import { GetUserByIdUseCase } from '../use-cases/get-user-by-id.use-case';
import { GetUserListUseCase } from '../use-cases/get-user-list.use-case';
import { GetUserCountUseCase } from '../use-cases/get-user-count.use-case';
import { GetUserWithRoleUseCase } from '../use-cases/get-user-with-role.use-case';

import { UpdateUserUseCase } from '../use-cases/update-user.use-case';
import { ResetPasswordUseCase } from '../use-cases/reset-password.use-case';
import { DeleteUserUseCase } from '../use-cases/delete-user.use-case';
import { SoftDeleteUserUseCase } from '../use-cases/soft-delete-user.use-case';
import { ToggleUserStatusUseCase } from '../use-cases/toggle-user-status.use-case';
import { UpdateAccountUseCase } from '../use-cases/update-account.use-case';
import { BulkActivateUseCase } from '../use-cases/bulk-activate.use-case';
import { CreateUserByAdminUseCase } from '../use-cases/create-user-by-admin.use-case';

import { UserUpdateDto } from '../dto/user.update.dto';
import { UserCreateDto } from '../dto/user.create.dto';
import { ResetPasswordDto } from '../dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { BulkActivateDto } from '../dto/bulk-activate.dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

const mockUser = {
  userId: 'abc-123',
  email: 'john@example.com',
  username: 'johnny',
  firstName: 'John',
  lastName: 'Doe',
};

describe('UserController', () => {
  let controller: UserController;

  const getMeUseCase = { execute: jest.fn() };
  const getUserByIdUseCase = { execute: jest.fn() };
  const getUserListUseCase = { execute: jest.fn() };
  const getUserCountUseCase = { execute: jest.fn() };
  const getUserWithRoleUseCase = { execute: jest.fn() };

  const updateUserUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const deleteUserUseCase = { execute: jest.fn() };
  const softDeleteUserUseCase = { execute: jest.fn() };
  const toggleUserStatusUseCase = { execute: jest.fn() };
  const updateAccountUseCase = { execute: jest.fn() };
  const bulkActivateUseCase = { execute: jest.fn() };
  const createUserByAdminUseCase = { execute: jest.fn() };

  const mockPayload: JwtPayload = {
    userId: 'user-123',
    email: 'john.doe@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: GetMeUseCase, useValue: getMeUseCase },
        { provide: GetUserByIdUseCase, useValue: getUserByIdUseCase },
        { provide: GetUserListUseCase, useValue: getUserListUseCase },
        { provide: GetUserCountUseCase, useValue: getUserCountUseCase },
        { provide: GetUserWithRoleUseCase, useValue: getUserWithRoleUseCase },

        { provide: UpdateUserUseCase, useValue: updateUserUseCase },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: DeleteUserUseCase, useValue: deleteUserUseCase },
        { provide: SoftDeleteUserUseCase, useValue: softDeleteUserUseCase },
        { provide: ToggleUserStatusUseCase, useValue: toggleUserStatusUseCase },
        { provide: UpdateAccountUseCase, useValue: updateAccountUseCase },
        { provide: BulkActivateUseCase, useValue: bulkActivateUseCase },
        { provide: CreateUserByAdminUseCase, useValue: createUserByAdminUseCase },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      getMeUseCase.execute.mockResolvedValue(mockUser);
      const result = await controller.getMe(mockUser as any);
      expect(getMeUseCase.execute).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockUser);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      getUserByIdUseCase.execute.mockResolvedValue(mockUser);
      const result = await controller.getUserById(mockUser.userId);
      expect(getUserByIdUseCase.execute).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toBe(mockUser);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const paginated = {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      };
      getUserListUseCase.execute.mockResolvedValue(paginated as any);

      const result = await controller.getUsers('1', '10');

      expect(getUserListUseCase.execute).toHaveBeenCalledWith(1, 10);
      expect(result).toBe(paginated);
    });
    it('should use default values when params missing', async () => {
      const paginated = {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      };
      getUserListUseCase.execute.mockResolvedValue(paginated as any);

      const result = await controller.getUsers(
        undefined as any,
        undefined as any,
      );

      expect(getUserListUseCase.execute).toHaveBeenCalledWith(1, 10);
      expect(result).toBe(paginated);
    });

    it('should propagate use case errors', async () => {
      getUserListUseCase.execute.mockRejectedValue(new Error('oops'));

      await expect(controller.getUsers('2', '5')).rejects.toThrow('oops');
    });
  });

  describe('getUserCount', () => {
    it('should return total users count', async () => {
      getUserCountUseCase.execute.mockResolvedValue(42);
      const result = await controller.getUserCount();
      expect(getUserCountUseCase.execute).toHaveBeenCalled();
      expect(result).toBe(42);
    });
  });

  describe('updateUser', () => {
    it('should update and return user', async () => {
      const updateDto: UserUpdateDto = {
        firstName: 'James',
        lastName: 'Smith',
      } as any;
      updateUserUseCase.execute.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      const result = await controller.updateUser(
        mockUser.userId,
        updateDto,
        mockPayload,
        mockReq,
      );
      expect(updateUserUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        updateDto,
        mockPayload.userId,
        expect.any(Object),
      );
      expect(result).toEqual({ ...mockUser, ...updateDto });
    });
  });

  describe('updateCurrentUser', () => {
    it('should update current user', async () => {
      const updateDto: UserUpdateDto = {
        firstName: 'James',
        lastName: 'Smith',
      } as any;
      updateUserUseCase.execute.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      const result = await controller.updateCurrentUser(
        mockUser as any,
        updateDto,
        mockReq,
      );
      expect(updateUserUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        updateDto,
        mockUser.userId,
        expect.any(Object),
      );
      expect(result).toEqual({ ...mockUser, ...updateDto });
    });
  });

  describe('resetCurrentUserPassword', () => {
    it('should reset current user password', async () => {
      const dto: ResetPasswordDto = { newPassword: 'xxx' } as any;
      resetPasswordUseCase.execute.mockResolvedValue(mockUser);
      const result = await controller.resetCurrentUserPassword(
        mockUser as any,
        dto,
      );
      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        dto,
      );
      expect(result).toBe(mockUser);
    });
  });

  describe('resetPassword', () => {
    it('should reset password by admin', async () => {
      const dto: ResetPasswordDto = { newPassword: 'xxx' } as any;
      resetPasswordUseCase.execute.mockResolvedValue(mockUser);
      const result = await controller.resetPassword(mockUser.userId, dto);
      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        dto,
      );
      expect(result).toBe(mockUser);
    });
  });

  describe('deleteCurrentUser', () => {
    it('should delete current user', async () => {
      deleteUserUseCase.execute.mockResolvedValue(undefined);
      const result = await controller.deleteCurrentUser(mockUser as any);
      expect(deleteUserUseCase.execute).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toBeUndefined();
    });
  });

  describe('deleteUser', () => {
    it('should delete user by id', async () => {
      deleteUserUseCase.execute.mockResolvedValue(undefined);
      const result = await controller.deleteUser(mockUser.userId);
      expect(deleteUserUseCase.execute).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toBeUndefined();
    });
  });

  describe('updateAccount', () => {
    it('should update user account by admin', async () => {
      const updateAccountDto: UpdateAccountDto = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        isActive: true,
        isVerified: true,
      };
      const updatedUser = { ...mockUser, ...updateAccountDto };

      updateAccountUseCase.execute.mockResolvedValue(updatedUser);

      const result = await controller.updateAccount(
        mockUser.userId,
        updateAccountDto,
      );

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        updateAccountDto,
      );
      expect(result).toBe(updatedUser);
    });

    it('should update user account with partial data', async () => {
      const updateAccountDto: UpdateAccountDto = {
        firstName: 'Updated',
      };
      const updatedUser = { ...mockUser, firstName: 'Updated' };

      updateAccountUseCase.execute.mockResolvedValue(updatedUser);

      const result = await controller.updateAccount(
        mockUser.userId,
        updateAccountDto,
      );

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        updateAccountDto,
      );
      expect(result).toBe(updatedUser);
    });
  });

  describe('bulkActivateUsers', () => {
    it('should bulk activate users', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['user1', 'user2', 'user3'],
      };
      const activatedUsers = [
        { ...mockUser, userId: 'user1', isActive: true },
        { ...mockUser, userId: 'user2', isActive: true },
        { ...mockUser, userId: 'user3', isActive: true },
      ];

      bulkActivateUseCase.execute.mockResolvedValue(activatedUsers);

      const result = await controller.bulkActivateUsers(bulkActivateDto);

      expect(bulkActivateUseCase.execute).toHaveBeenCalledWith(bulkActivateDto);
      expect(result).toBe(activatedUsers);
    });

    it('should bulk activate single user', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['user1'],
      };
      const activatedUsers = [{ ...mockUser, userId: 'user1', isActive: true }];

      bulkActivateUseCase.execute.mockResolvedValue(activatedUsers);

      const result = await controller.bulkActivateUsers(bulkActivateDto);

      expect(bulkActivateUseCase.execute).toHaveBeenCalledWith(bulkActivateDto);
      expect(result).toBe(activatedUsers);
    });
  });

  describe('createUser', () => {
    it('should create a new user and return UserResponseDto', async () => {
      const createUserDto: UserCreateDto = {
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'StrongPassword123!',
        roleIds: ['role-123'],
      };

      const createdUser = {
        id: 'new-user-123',
        ...createUserDto,
        roles: [{ id: 'role-123', name: 'User' }],
        isActive: true,
        isVerified: false,
        isTwoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createUserByAdminUseCase.execute.mockResolvedValue(createdUser);

      const result = await controller.createUser(createUserDto, mockPayload);

      expect(createUserByAdminUseCase.execute).toHaveBeenCalledWith(
        createUserDto,
        mockPayload.userId,
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(createdUser.id);
      expect(result.username).toBe(createdUser.username);
      expect(result.email).toBe(createdUser.email);
    });

    it('should handle conflict errors when username exists', async () => {
      const createUserDto: UserCreateDto = {
        username: 'existinguser',
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'StrongPassword123!',
      };

      const conflictError = new Error('Username already exists');
      createUserByAdminUseCase.execute.mockRejectedValue(conflictError);

      await expect(
        controller.createUser(createUserDto, mockPayload),
      ).rejects.toThrow(conflictError);

      expect(createUserByAdminUseCase.execute).toHaveBeenCalledWith(
        createUserDto,
        mockPayload.userId,
      );
    });

    it('should create user without roleIds', async () => {
      const createUserDto: UserCreateDto = {
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'StrongPassword123!',
      };

      const createdUser = {
        id: 'new-user-123',
        ...createUserDto,
        roles: [],
        isActive: true,
        isVerified: false,
        isTwoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createUserByAdminUseCase.execute.mockResolvedValue(createdUser);

      const result = await controller.createUser(createUserDto, mockPayload);

      expect(createUserByAdminUseCase.execute).toHaveBeenCalledWith(
        createUserDto,
        mockPayload.userId,
      );
      expect(result.roles).toEqual([]);
    });
  });
});
