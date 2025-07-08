import { Test, TestingModule } from '@nestjs/testing';
import { SoftDeleteUserUseCase } from '../soft-delete-user.use-case';
import { UserRepositoryInterface } from '../../../domain/interfaces/user.repository.interface';
import { LogHistoryUseCase } from '../../../../history/application/use-cases/log-history.use-case';
import {
  UserNotFoundException,
  CannotDeleteOwnAccountException,
  CannotDeleteLastAdminException,
} from '../../../domain/exceptions/user.exception';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../../roles/domain/entities/role.entity';
import { DeletionReason } from '../../dto/delete-account.dto';

describe('SoftDeleteUserUseCase', () => {
  let useCase: SoftDeleteUserUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;

  const createMockUser = (overrides: Partial<User> = {}): User => {
    const user = Object.create(User.prototype);
    return Object.assign(user, {
      id: 'default-id',
      username: 'defaultuser',
      firstName: 'Default',
      lastName: 'User',
      password: 'hashed-password',
      email: 'default@test.com',
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoggedIn: null,
      roles: [],
      recoveryCodes: null,
      isActive: true,
      isVerified: true,
      deletedAt: null,
      ...overrides,
    });
  };

  const createMockRole = (overrides: Partial<Role> = {}): Role => {
    const role = Object.create(Role.prototype);
    return Object.assign(role, {
      id: 'default-role-id',
      name: 'Default',
      canCreateServer: false,
      isAdmin: false,
      users: [],
      permissionServers: [],
      permissionVms: [],
      ...overrides,
    });
  };

  const mockAdminRole = createMockRole({
    id: 'role-admin',
    name: 'Admin',
    isAdmin: true,
  });

  const mockUserRole = createMockRole({
    id: 'role-user',
    name: 'User',
    isAdmin: false,
  });

  const mockAdminUser = createMockUser({
    id: 'admin-user-id',
    username: 'admin',
    email: 'admin@test.com',
    roles: [mockAdminRole],
  });

  const getMockTargetUser = () =>
    createMockUser({
      id: 'target-user-id',
      username: 'targetuser',
      email: 'target@test.com',
      roles: [mockUserRole],
    });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoftDeleteUserUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findById: jest.fn(),
            findWithRoles: jest.fn(),
            countActiveAdmins: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            executeStructured: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<SoftDeleteUserUseCase>(SoftDeleteUserUseCase);
    userRepository = module.get('UserRepositoryInterface');
    logHistoryUseCase = module.get(LogHistoryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully soft delete a user', async () => {
      const deletedAt = new Date();
      const deletedUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [mockUserRole],
        deletedAt,
        isActive: false,
      });

      userRepository.findById.mockResolvedValue(getMockTargetUser());
      userRepository.findWithRoles.mockResolvedValue(getMockTargetUser());
      userRepository.countActiveAdmins.mockResolvedValue(2);
      userRepository.save.mockResolvedValue(deletedUser);

      await useCase.execute(
        'target-user-id',
        'admin-user-id',
        DeletionReason.ADMIN_ACTION,
        'Test deletion',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(userRepository.findById).toHaveBeenCalledWith('target-user-id');
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          deletedAt: expect.any(Date),
        }),
      );

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'user',
        entityId: 'target-user-id',
        action: 'USER_DELETED',
        userId: 'admin-user-id',
        oldValue: {
          isActive: true,
          deletedAt: null,
        },
        newValue: {
          isActive: false,
          deletedAt: expect.any(Date),
        },
        metadata: {
          deletedBy: 'admin-user-id',
          deletedAt: expect.any(String),
          reason: DeletionReason.ADMIN_ACTION,
          details: 'Test deletion',
          userEmail: 'target@test.com',
          username: 'targetuser',
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent-id', 'admin-user-id'),
      ).rejects.toThrow(UserNotFoundException);

      expect(userRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundException if user is already deleted', async () => {
      const deletedUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [mockUserRole],
        deletedAt: new Date(),
      });
      userRepository.findById.mockResolvedValue(deletedUser);

      await expect(
        useCase.execute('target-user-id', 'admin-user-id'),
      ).rejects.toThrow(UserNotFoundException);

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
    });

    it('should throw CannotDeleteOwnAccountException when admin tries to delete themselves', async () => {
      userRepository.findById.mockResolvedValue(mockAdminUser);

      await expect(
        useCase.execute('admin-user-id', 'admin-user-id'),
      ).rejects.toThrow(CannotDeleteOwnAccountException);

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
    });

    it('should throw CannotDeleteLastAdminException when trying to delete the last admin', async () => {
      const adminUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [mockAdminRole],
      });

      userRepository.findById.mockResolvedValue(adminUser);
      userRepository.findWithRoles.mockResolvedValue(adminUser);
      userRepository.countActiveAdmins.mockResolvedValue(1);

      await expect(
        useCase.execute('target-user-id', 'admin-user-id'),
      ).rejects.toThrow(CannotDeleteLastAdminException);

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
    });

    it('should handle users with no email', async () => {
      const userWithoutEmail = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: undefined,
        roles: [mockUserRole],
      });
      const deletedUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: undefined,
        roles: [mockUserRole],
        deletedAt: new Date(),
        isActive: false,
      });

      userRepository.findById.mockResolvedValue(userWithoutEmail);
      userRepository.findWithRoles.mockResolvedValue(userWithoutEmail);
      userRepository.countActiveAdmins.mockResolvedValue(2);
      userRepository.save.mockResolvedValue(deletedUser);

      await useCase.execute('target-user-id', 'admin-user-id');

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userEmail: '',
            username: 'targetuser',
          }),
        }),
      );
    });

    it('should use default reason when not provided', async () => {
      const deletedUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [mockUserRole],
        deletedAt: new Date(),
        isActive: false,
      });

      userRepository.findById.mockResolvedValue(getMockTargetUser());
      userRepository.findWithRoles.mockResolvedValue(getMockTargetUser());
      userRepository.countActiveAdmins.mockResolvedValue(2);
      userRepository.save.mockResolvedValue(deletedUser);

      await useCase.execute('target-user-id', 'admin-user-id');

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            reason: DeletionReason.ADMIN_ACTION,
          }),
        }),
      );
    });

    it('should correctly identify admin users with capital Admin role', async () => {
      const adminRoleCapital = createMockRole({
        id: 'role-admin',
        name: 'Admin',
        isAdmin: true,
      });
      const adminUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [adminRoleCapital],
      });

      userRepository.findById.mockResolvedValue(adminUser);
      userRepository.findWithRoles.mockResolvedValue(adminUser);
      userRepository.countActiveAdmins.mockResolvedValue(1);

      await expect(
        useCase.execute('target-user-id', 'admin-user-id'),
      ).rejects.toThrow(CannotDeleteLastAdminException);
    });

    it('should correctly identify admin users with lowercase admin role', async () => {
      const adminRoleLowercase = createMockRole({
        id: 'role-admin',
        name: 'admin',
        isAdmin: true,
      });
      const adminUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [adminRoleLowercase],
      });

      userRepository.findById.mockResolvedValue(adminUser);
      userRepository.findWithRoles.mockResolvedValue(adminUser);
      userRepository.countActiveAdmins.mockResolvedValue(1);

      await expect(
        useCase.execute('target-user-id', 'admin-user-id'),
      ).rejects.toThrow(CannotDeleteLastAdminException);
    });

    it('should handle missing IP address and user agent', async () => {
      const deletedUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [mockUserRole],
        deletedAt: new Date(),
        isActive: false,
      });

      userRepository.findById.mockResolvedValue(getMockTargetUser());
      userRepository.findWithRoles.mockResolvedValue(getMockTargetUser());
      userRepository.countActiveAdmins.mockResolvedValue(2);
      userRepository.save.mockResolvedValue(deletedUser);

      await useCase.execute(
        'target-user-id',
        'admin-user-id',
        DeletionReason.ADMIN_ACTION,
        undefined,
        undefined,
        undefined,
      );

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: undefined,
          userAgent: undefined,
        }),
      );
    });

    it('should allow deleting non-admin users when multiple admins exist', async () => {
      const deletedUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [mockUserRole],
        deletedAt: new Date(),
        isActive: false,
      });

      userRepository.findById.mockResolvedValue(getMockTargetUser());
      userRepository.findWithRoles.mockResolvedValue(getMockTargetUser());
      userRepository.countActiveAdmins.mockResolvedValue(3);
      userRepository.save.mockResolvedValue(deletedUser);

      await useCase.execute('target-user-id', 'admin-user-id');

      expect(userRepository.save).toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalled();
    });

    it('should handle user with no roles gracefully', async () => {
      const userWithoutRoles = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [],
      });
      const deletedUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [],
        deletedAt: new Date(),
        isActive: false,
      });

      userRepository.findById.mockResolvedValue(userWithoutRoles);
      userRepository.findWithRoles.mockResolvedValue(userWithoutRoles);
      userRepository.countActiveAdmins.mockResolvedValue(2);
      userRepository.save.mockResolvedValue(deletedUser);

      await useCase.execute('target-user-id', 'admin-user-id');

      expect(userRepository.save).toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalled();
    });

    it('should handle null response from findWithRoles', async () => {
      const deletedUser = createMockUser({
        id: 'target-user-id',
        username: 'targetuser',
        email: 'target@test.com',
        roles: [mockUserRole],
        deletedAt: new Date(),
        isActive: false,
      });

      userRepository.findById.mockResolvedValue(getMockTargetUser());
      userRepository.findWithRoles.mockResolvedValue(null);
      userRepository.countActiveAdmins.mockResolvedValue(2);
      userRepository.save.mockResolvedValue(deletedUser);

      await useCase.execute('target-user-id', 'admin-user-id');

      expect(userRepository.save).toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalled();
    });
  });
});
