import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';

import { GetMeUseCase } from '../use-cases/get-me.use-case';
import { GetUserByIdUseCase } from '../use-cases/get-user-by-id.use-case';
import { GetUserListUseCase } from '../use-cases/get-user-list.use-case';
import { GetUserCountUseCase } from '../use-cases/get-user-count.use-case';

import { UpdateUserUseCase } from '../use-cases/update-user.use-case';
import { ResetPasswordUseCase } from '../use-cases/reset-password.use-case';
import { DeleteUserUseCase } from '../use-cases/delete-user.use-case';

import { UserUpdateDto } from '../dto/user.update.dto';
import { ResetPasswordDto } from '../dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

const mockUser = {
  userId: 'abc-123',
  email: 'john@example.com',
  username: 'johnny',
  firstName: 'John',
  lastName: 'Doe',
  roleId: 'user-role-id',
};

describe('UserController', () => {
  let controller: UserController;

  const getMeUseCase = { execute: jest.fn() };
  const getUserByIdUseCase = { execute: jest.fn() };
  const getUserListUseCase = { execute: jest.fn() };
  const getUserCountUseCase = { execute: jest.fn() };

  const updateUserUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const deleteUserUseCase = { execute: jest.fn() };

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

        { provide: UpdateUserUseCase, useValue: updateUserUseCase },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: DeleteUserUseCase, useValue: deleteUserUseCase },
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
      const result = await controller.updateUser(
        mockUser.userId,
        updateDto,
        mockPayload,
      );
      expect(updateUserUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        updateDto,
        mockPayload,
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
      const result = await controller.updateCurrentUser(
        mockUser as any,
        updateDto,
      );
      expect(updateUserUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        updateDto,
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
});
