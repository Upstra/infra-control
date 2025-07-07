import { Test, TestingModule } from '@nestjs/testing';
import { ToggleUserStatusUseCase } from '../toggle-user-status.use-case';
import { UserTypeormRepository } from '../../../infrastructure/repositories/user.typeorm.repository';
import { LogHistoryUseCase } from '../../../../history/application/use-cases/log-history.use-case';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../../roles/domain/entities/role.entity';
import { UserResponseDto } from '../../dto/user.response.dto';
import {
  CannotToggleOwnStatusException,
  CannotDeactivateLastAdminException,
  UserNotFoundException,
} from '../../../domain/exceptions/user.exception';

describe('ToggleUserStatusUseCase', () => {
  let useCase: ToggleUserStatusUseCase;
  let userRepository: jest.Mocked<UserTypeormRepository>;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;

  const mockUser = (): User => {
    const user = {
      id: 'user-id',
      username: 'testuser',
      email: 'test@example.com',
      active: true,
      isTwoFactorEnabled: false,
      firstName: 'Test',
      lastName: 'User',
      deleted: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [],
    } as User;
    return user;
  };

  const mockAdmin = (): User => {
    const admin = {
      id: 'admin-id',
      username: 'admin',
      email: 'admin@example.com',
      active: true,
      isTwoFactorEnabled: false,
      firstName: 'Admin',
      lastName: 'User',
      deleted: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [],
    } as User;
    return admin;
  };

  const mockRole = (isAdmin: boolean): Role => {
    const role = new Role();
    role.id = 'role-id';
    role.name = isAdmin ? 'admin' : 'user';
    role.isAdmin = isAdmin;
    return role;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToggleUserStatusUseCase,
        {
          provide: UserTypeormRepository,
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

    useCase = module.get<ToggleUserStatusUseCase>(ToggleUserStatusUseCase);
    userRepository = module.get(UserTypeormRepository);
    logHistoryUseCase = module.get(LogHistoryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should activate a deactivated user', async () => {
      const user = mockUser();
      user.active = false;
      const savedUser = { ...user, active: true };

      userRepository.findById.mockResolvedValue(user);
      const userWithRole = { ...user, roles: [mockRole(false)] } as User;
      userRepository.findWithRoles.mockResolvedValue(userWithRole);
      userRepository.save.mockResolvedValue(savedUser as User);

      const result = await useCase.execute({
        targetUserId: 'user-id',
        adminId: 'admin-id',
        reason: 'User requested reactivation',
        requestContext: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toBe('user-id');
      expect(result.username).toBe('testuser');
      expect(result.active).toBe(true);

      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        active: true,
      });

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'user',
        entityId: 'user-id',
        action: 'user.activated',
        userId: 'admin-id',
        oldValue: { active: false },
        newValue: { active: true },
        metadata: {
          username: 'testuser',
          reason: 'User requested reactivation',
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should deactivate an active user', async () => {
      const user = mockUser();
      user.active = true;
      const savedUser = { ...user, active: false };

      userRepository.findById.mockResolvedValue(user);
      const userWithRole = { ...user, roles: [mockRole(false)] } as User;
      userRepository.findWithRoles.mockResolvedValue(userWithRole);
      userRepository.save.mockResolvedValue(savedUser as User);

      const result = await useCase.execute({
        targetUserId: 'user-id',
        adminId: 'admin-id',
        reason: 'Security violation',
      });

      expect(result.active).toBe(false);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        active: false,
      });

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'user',
        entityId: 'user-id',
        action: 'user.deactivated',
        userId: 'admin-id',
        oldValue: { active: true },
        newValue: { active: false },
        metadata: {
          username: 'testuser',
          reason: 'Security violation',
        },
        ipAddress: undefined,
        userAgent: undefined,
      });
    });

    it('should reactivate a soft-deleted user', async () => {
      const user = mockUser();
      user.active = false;
      user.deleted = true;
      user.deletedAt = new Date();
      const savedUser = {
        ...user,
        active: true,
        deleted: false,
        deletedAt: null,
      };

      userRepository.findById.mockResolvedValue(user);
      const userWithRole = { ...user, roles: [mockRole(false)] } as User;
      userRepository.findWithRoles.mockResolvedValue(userWithRole);
      userRepository.save.mockResolvedValue(savedUser as User);

      const result = await useCase.execute({
        targetUserId: 'user-id',
        adminId: 'admin-id',
      });

      expect(result.active).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        active: true,
        deleted: false,
        deletedAt: null,
      });
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          targetUserId: 'non-existent-id',
          adminId: 'admin-id',
        }),
      ).rejects.toThrow(UserNotFoundException);

      expect(userRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
    });

    it('should throw CannotToggleOwnStatusException when trying to toggle own status', async () => {
      const user = mockUser();
      userRepository.findById.mockResolvedValue(user);

      await expect(
        useCase.execute({
          targetUserId: 'user-id',
          adminId: 'user-id',
        }),
      ).rejects.toThrow(CannotToggleOwnStatusException);

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
    });

    it('should throw CannotDeactivateLastAdminException when trying to deactivate last admin', async () => {
      const admin = mockAdmin();
      admin.active = true;

      userRepository.findById.mockResolvedValue(admin);
      const adminWithRole = { ...admin, roles: [mockRole(true)] } as User;
      userRepository.findWithRoles.mockResolvedValue(adminWithRole);
      userRepository.countActiveAdmins.mockResolvedValue(0);

      await expect(
        useCase.execute({
          targetUserId: 'admin-id',
          adminId: 'other-admin-id',
        }),
      ).rejects.toThrow(CannotDeactivateLastAdminException);

      expect(userRepository.countActiveAdmins).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
    });

    it('should allow deactivating an admin if there are other active admins', async () => {
      const admin = mockAdmin();
      admin.active = true;
      const savedAdmin = { ...admin, active: false };

      userRepository.findById.mockResolvedValue(admin);
      const adminWithRole = { ...admin, roles: [mockRole(true)] } as User;
      userRepository.findWithRoles.mockResolvedValue(adminWithRole);
      userRepository.countActiveAdmins.mockResolvedValue(2);
      userRepository.save.mockResolvedValue(savedAdmin as User);

      const result = await useCase.execute({
        targetUserId: 'admin-id',
        adminId: 'other-admin-id',
      });

      expect(result.active).toBe(false);
      expect(userRepository.countActiveAdmins).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should allow reactivating an admin without checking active admin count', async () => {
      const admin = mockAdmin();
      admin.active = false;
      const savedAdmin = { ...admin, active: true };

      userRepository.findById.mockResolvedValue(admin);
      const adminWithRole = { ...admin, roles: [mockRole(true)] } as User;
      userRepository.findWithRoles.mockResolvedValue(adminWithRole);
      userRepository.save.mockResolvedValue(savedAdmin as User);

      const result = await useCase.execute({
        targetUserId: 'admin-id',
        adminId: 'other-admin-id',
      });

      expect(result.active).toBe(true);
      expect(userRepository.countActiveAdmins).not.toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should handle user without role gracefully', async () => {
      const user = mockUser();
      user.active = true;
      const savedUser = { ...user, active: false };

      userRepository.findById.mockResolvedValue(user);
      const userWithoutRole = { ...user, roles: [] } as User;
      userRepository.findWithRoles.mockResolvedValue(userWithoutRole);
      userRepository.save.mockResolvedValue(savedUser as User);

      const result = await useCase.execute({
        targetUserId: 'user-id',
        adminId: 'admin-id',
      });

      expect(result.active).toBe(false);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should handle missing request context', async () => {
      const user = mockUser();
      const savedUser = { ...user, active: false };

      userRepository.findById.mockResolvedValue(user);
      const userWithRole = { ...user, roles: [mockRole(false)] } as User;
      userRepository.findWithRoles.mockResolvedValue(userWithRole);
      userRepository.save.mockResolvedValue(savedUser as User);

      await useCase.execute({
        targetUserId: 'user-id',
        adminId: 'admin-id',
      });

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: undefined,
          userAgent: undefined,
        }),
      );
    });

    it('should not reactivate a deleted user when deactivating', async () => {
      const user = mockUser();
      user.active = true;
      user.deleted = true;
      user.deletedAt = new Date();
      const savedUser = { ...user, active: false };

      userRepository.findById.mockResolvedValue(user);
      const userWithRole = { ...user, roles: [mockRole(false)] } as User;
      userRepository.findWithRoles.mockResolvedValue(userWithRole);
      userRepository.save.mockResolvedValue(savedUser as User);

      const result = await useCase.execute({
        targetUserId: 'user-id',
        adminId: 'admin-id',
      });

      expect(result.active).toBe(false);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        active: false,
      });
    });

    it('should call findWithRoles even when user does not exist in findById', async () => {
      const user = mockUser();

      userRepository.findById.mockResolvedValue(user);
      userRepository.findWithRoles.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ ...user, active: false } as User);

      const result = await useCase.execute({
        targetUserId: 'user-id',
        adminId: 'admin-id',
      });

      expect(result.active).toBe(false);
      expect(userRepository.findWithRoles).toHaveBeenCalledWith('user-id');
    });

    it('should log action without reason when reason is not provided', async () => {
      const user = mockUser();
      const savedUser = { ...user, active: false };

      userRepository.findById.mockResolvedValue(user);
      const userWithRole = { ...user, roles: [mockRole(false)] } as User;
      userRepository.findWithRoles.mockResolvedValue(userWithRole);
      userRepository.save.mockResolvedValue(savedUser as User);

      await useCase.execute({
        targetUserId: 'user-id',
        adminId: 'admin-id',
      });

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            reason: undefined,
          }),
        }),
      );
    });
  });
});
