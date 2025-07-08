import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateAccountUseCase } from '../update-account.use-case';
import { UserDomainService } from '@modules/users/domain/services/user.domain.service';
import { UpdateAccountDto } from '../../dto/update-account.dto';
import { UserResponseDto } from '../../dto/user.response.dto';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserExceptions } from '@modules/users/domain/exceptions/user.exception';

describe('UpdateAccountUseCase', () => {
  let useCase: UpdateAccountUseCase;
  let userDomainService: jest.Mocked<UserDomainService>;
  let userRepository: any;

  const mockUser = Object.assign(new User(), {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    password: 'hashedPassword',
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
    roles: [],
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockUserDomainService = {
      updateAccount: jest.fn(),
    };

    const mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAccountUseCase,
        {
          provide: UserDomainService,
          useValue: mockUserDomainService,
        },
        {
          provide: 'UserRepositoryInterface',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateAccountUseCase>(UpdateAccountUseCase);
    userDomainService = module.get(UserDomainService);
    userRepository = module.get('UserRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully update user account with all fields', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        isActive: false,
        isVerified: false,
      };

      const updatedUser = { ...mockUser, ...updateData };

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.updateAccount.mockResolvedValue(updatedUser as User);
      userRepository.save.mockResolvedValue(updatedUser as User);

      const result = await useCase.execute(mockUser.id, updateData);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(userDomainService.updateAccount).toHaveBeenCalledWith(
        mockUser,
        updateData,
      );
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toBe(mockUser.id);
    });

    it('should successfully update user with partial fields', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'Updated',
      };

      const updatedUser = { ...mockUser, firstName: 'Updated' };

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.updateAccount.mockResolvedValue(updatedUser as User);
      userRepository.save.mockResolvedValue(updatedUser as User);

      const result = await useCase.execute(mockUser.id, updateData);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(userDomainService.updateAccount).toHaveBeenCalledWith(
        mockUser,
        updateData,
      );
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it('should successfully update user with empty object', async () => {
      const updateData: UpdateAccountDto = {};

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.updateAccount.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await useCase.execute(mockUser.id, updateData);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(userDomainService.updateAccount).toHaveBeenCalledWith(
        mockUser,
        updateData,
      );
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'Updated',
      };

      userRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent-id', updateData),
      ).rejects.toThrow(NotFoundException);

      expect(userRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(userDomainService.updateAccount).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate other errors', async () => {
      const updateData: UpdateAccountDto = {
        email: 'duplicate@example.com',
      };

      const error = new Error('Email already exists');
      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.updateAccount.mockRejectedValue(error);

      await expect(useCase.execute(mockUser.id, updateData)).rejects.toThrow(
        error,
      );

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(userDomainService.updateAccount).toHaveBeenCalledWith(
        mockUser,
        updateData,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const updateData: UpdateAccountDto = {
        firstName: 'Updated',
      };

      const updatedUser = { ...mockUser, firstName: 'Updated' };
      const error = new Error('Database error');

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.updateAccount.mockResolvedValue(updatedUser as User);
      userRepository.save.mockRejectedValue(error);

      await expect(useCase.execute(mockUser.id, updateData)).rejects.toThrow(
        error,
      );

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(userDomainService.updateAccount).toHaveBeenCalledWith(
        mockUser,
        updateData,
      );
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should update only email', async () => {
      const updateData: UpdateAccountDto = {
        email: 'newemail@example.com',
      };

      const updatedUser = { ...mockUser, email: 'newemail@example.com' };

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.updateAccount.mockResolvedValue(updatedUser as User);
      userRepository.save.mockResolvedValue(updatedUser as User);

      const result = await useCase.execute(mockUser.id, updateData);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(userDomainService.updateAccount).toHaveBeenCalledWith(
        mockUser,
        updateData,
      );
    });

    it('should update only isActive status', async () => {
      const updateData: UpdateAccountDto = {
        isActive: false,
      };

      const updatedUser = { ...mockUser, isActive: false };

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.updateAccount.mockResolvedValue(updatedUser as User);
      userRepository.save.mockResolvedValue(updatedUser as User);

      const result = await useCase.execute(mockUser.id, updateData);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(userDomainService.updateAccount).toHaveBeenCalledWith(
        mockUser,
        updateData,
      );
    });

    it('should update only isVerified status', async () => {
      const updateData: UpdateAccountDto = {
        isVerified: false,
      };

      const updatedUser = { ...mockUser, isVerified: false };

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.updateAccount.mockResolvedValue(updatedUser as User);
      userRepository.save.mockResolvedValue(updatedUser as User);

      const result = await useCase.execute(mockUser.id, updateData);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(userDomainService.updateAccount).toHaveBeenCalledWith(
        mockUser,
        updateData,
      );
    });
  });
});
