import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';

import { GetMeUseCase } from '../use-cases/get-me.use-case';
import { GetUserByIdUseCase } from '../use-cases/get-user-by-id.use-case';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';
import { ResetPasswordUseCase } from '../use-cases/reset-password.use-case';
import { DeleteUserUseCase } from '../use-cases/delete-user.use-case';

import { UserUpdateDto } from '../dto/user.update.dto';
import { ResetPasswordDto } from '../dto';

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

  // Mocks UseCases
  const getMeUseCase = { execute: jest.fn() };
  const getUserByIdUseCase = { execute: jest.fn() };
  const updateUserUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const deleteUserUseCase = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: GetMeUseCase, useValue: getMeUseCase },
        { provide: GetUserByIdUseCase, useValue: getUserByIdUseCase },
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
      const result = await controller.updateUser(mockUser.userId, updateDto);
      expect(updateUserUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        updateDto,
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
