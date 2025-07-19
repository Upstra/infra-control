import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BulkActivateUseCase } from '../bulk-activate.use-case';
import { UserDomainService } from '@modules/users/domain/services/user.domain.service';
import { BulkActivateDto } from '../../dto/bulk-activate.dto';
import { UserResponseDto } from '../../dto/user.response.dto';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserNotFoundException } from '@modules/users/domain/exceptions/user.exception';

describe('BulkActivateUseCase', () => {
  let useCase: BulkActivateUseCase;
  let userDomainService: jest.Mocked<UserDomainService>;
  let userRepository: any;

  const createMockUser = (id: string, isActive: boolean = false): User =>
    Object.assign(new User(), {
      id,
      username: `user${id}`,
      email: `user${id}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      isActive,
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
      activateUser: jest.fn(),
    };

    const mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkActivateUseCase,
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

    useCase = module.get<BulkActivateUseCase>(BulkActivateUseCase);
    userDomainService = module.get(UserDomainService);
    userRepository = module.get('UserRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully activate multiple users', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1', 'id2', 'id3'],
      };

      const mockUsers = bulkActivateDto.userIds.map((id) =>
        createMockUser(id, false),
      );
      const activatedUsers = mockUsers.map((user) => ({
        ...user,
        isActive: true,
      }));

      mockUsers.forEach((user, index) => {
        userRepository.findById.mockResolvedValueOnce(user);
        userDomainService.activateUser.mockResolvedValueOnce(
          activatedUsers[index] as User,
        );
        userRepository.save.mockResolvedValueOnce(
          activatedUsers[index] as User,
        );
      });

      const result = await useCase.execute(bulkActivateDto);

      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(UserResponseDto);
      expect(userRepository.findById).toHaveBeenCalledTimes(3);
      expect(userDomainService.activateUser).toHaveBeenCalledTimes(3);
      expect(userRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should successfully activate single user', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1'],
      };

      const mockUser = createMockUser('id1', false);
      const activatedUser = { ...mockUser, isActive: true };

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.activateUser.mockResolvedValue(activatedUser as User);
      userRepository.save.mockResolvedValue(activatedUser as User);

      const result = await useCase.execute(bulkActivateDto);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(UserResponseDto);
      expect(userRepository.findById).toHaveBeenCalledWith('id1');
      expect(userDomainService.activateUser).toHaveBeenCalledWith(mockUser);
      expect(userRepository.save).toHaveBeenCalledWith(activatedUser);
    });

    it('should continue processing when some users not found', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1', 'id2', 'id3'],
      };

      const mockUser1 = createMockUser('id1', false);
      const activatedUser1 = { ...mockUser1, isActive: true };

      userRepository.findById.mockResolvedValueOnce(mockUser1);
      userDomainService.activateUser.mockResolvedValueOnce(
        activatedUser1 as User,
      );
      userRepository.save.mockResolvedValueOnce(activatedUser1 as User);

      userRepository.findById.mockResolvedValueOnce(null);

      await expect(useCase.execute(bulkActivateDto)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(userRepository.findById).toHaveBeenCalledTimes(2);
      expect(userDomainService.activateUser).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw UserNotFoundException when first user not found', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1'],
      };

      userRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(bulkActivateDto)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(userRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should propagate UserNotFoundException when thrown', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1'],
      };

      userRepository.findById.mockRejectedValueOnce(new UserNotFoundException('id1'));

      await expect(useCase.execute(bulkActivateDto)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(userRepository.findById).toHaveBeenCalledTimes(1);
      expect(userDomainService.activateUser).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should handle NotFoundException thrown from other sources', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1', 'id2'],
      };

      const mockUser1 = createMockUser('id1', false);
      const activatedUser1 = { ...mockUser1, isActive: true };

      userRepository.findById.mockResolvedValueOnce(mockUser1);
      userDomainService.activateUser.mockResolvedValueOnce(
        activatedUser1 as User,
      );
      userRepository.save.mockResolvedValueOnce(activatedUser1 as User);

      const notFoundError = new NotFoundException('User not found');
      userRepository.findById.mockRejectedValueOnce(notFoundError);

      const result = await useCase.execute(bulkActivateDto);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('id1');
      expect(userRepository.findById).toHaveBeenCalledTimes(2);
      expect(userDomainService.activateUser).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should propagate non-UserNotFoundError errors', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1'],
      };

      const error = new Error('Database connection error');
      userRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(bulkActivateDto)).rejects.toThrow(error);

      expect(userRepository.findById).toHaveBeenCalledWith('id1');
      expect(userDomainService.activateUser).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should handle activation errors', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1'],
      };

      const mockUser = createMockUser('id1', false);
      const error = new Error('Activation failed');

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.activateUser.mockRejectedValue(error);

      await expect(useCase.execute(bulkActivateDto)).rejects.toThrow(error);

      expect(userRepository.findById).toHaveBeenCalledWith('id1');
      expect(userDomainService.activateUser).toHaveBeenCalledWith(mockUser);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1'],
      };

      const mockUser = createMockUser('id1', false);
      const activatedUser = { ...mockUser, isActive: true };
      const error = new Error('Save failed');

      userRepository.findById.mockResolvedValue(mockUser);
      userDomainService.activateUser.mockResolvedValue(activatedUser as User);
      userRepository.save.mockRejectedValue(error);

      await expect(useCase.execute(bulkActivateDto)).rejects.toThrow(error);

      expect(userRepository.findById).toHaveBeenCalledWith('id1');
      expect(userDomainService.activateUser).toHaveBeenCalledWith(mockUser);
      expect(userRepository.save).toHaveBeenCalledWith(activatedUser);
    });

    it('should handle mixed success and NotFoundException', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1', 'id2'],
      };

      const mockUser1 = createMockUser('id1', false);
      const activatedUser1 = { ...mockUser1, isActive: true };

      // User 1: Success
      userRepository.findById.mockResolvedValueOnce(mockUser1);
      userDomainService.activateUser.mockResolvedValueOnce(
        activatedUser1 as User,
      );
      userRepository.save.mockResolvedValueOnce(activatedUser1 as User);

      // User 2: throws NotFoundException which should be caught
      const notFoundError = new NotFoundException('User not found');
      userRepository.findById.mockRejectedValueOnce(notFoundError);

      const result = await useCase.execute(bulkActivateDto);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('id1');
      expect(userRepository.findById).toHaveBeenCalledTimes(2);
      expect(userDomainService.activateUser).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when all users throw NotFoundException', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1', 'id2'],
      };

      const notFoundError = new NotFoundException('User not found');
      userRepository.findById
        .mockRejectedValueOnce(notFoundError)
        .mockRejectedValueOnce(notFoundError);

      await expect(useCase.execute(bulkActivateDto)).rejects.toThrow(
        new NotFoundException('None of the provided user IDs were found'),
      );

      expect(userRepository.findById).toHaveBeenCalledTimes(2);
      expect(userDomainService.activateUser).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should process users in order', async () => {
      const bulkActivateDto: BulkActivateDto = {
        userIds: ['id1', 'id2', 'id3'],
      };

      const callOrder: string[] = [];

      userRepository.findById.mockImplementation((id) => {
        callOrder.push(`find-${id}`);
        return Promise.resolve(createMockUser(id, false));
      });

      userDomainService.activateUser.mockImplementation((user) => {
        callOrder.push(`activate-${user.id}`);
        return Promise.resolve({ ...user, isActive: true } as User);
      });

      userRepository.save.mockImplementation((user) => {
        callOrder.push(`save-${user.id}`);
        return Promise.resolve(user);
      });

      await useCase.execute(bulkActivateDto);

      expect(callOrder).toEqual([
        'find-id1',
        'activate-id1',
        'save-id1',
        'find-id2',
        'activate-id2',
        'save-id2',
        'find-id3',
        'activate-id3',
        'save-id3',
      ]);
    });
  });
});
