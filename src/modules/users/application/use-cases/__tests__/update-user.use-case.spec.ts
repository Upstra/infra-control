import { UpdateUserUseCase } from '../update-user.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import { UserUpdateDto } from '../../dto/user.update.dto';
import { User } from '@/modules/users/domain/entities/user.entity';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { UserResponseDto } from '../../dto/user.response.dto';
import { UserConflictException } from '@/modules/users/domain/exceptions/user.exception';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let domain: jest.Mocked<UserDomainService>;
  let logHistory: jest.Mocked<LogHistoryUseCase>;

  const user = createMockUser({ id: 'user-1', email: 'old@mail.com' });

  const dto: UserUpdateDto = {
    email: 'new@mail.com',
    username: 'new_username',
    firstName: 'New',
    lastName: 'User',
  };

  beforeEach(() => {
    repo = {
      findOneByField: jest.fn(),
      save: jest.fn(),
      countAdmins: jest.fn(),
    } as any;

    domain = {
      ensureUniqueEmail: jest.fn(),
      ensureUniqueUsername: jest.fn(),
      updateUserEntity: jest.fn(),
    } as any;

    logHistory = {
      execute: jest.fn(),
      executeStructured: jest.fn(),
    } as any;

    useCase = new UpdateUserUseCase(repo, domain, logHistory);
  });

  it('should update the user and return UserResponseDto', async () => {
    const updated = Object.setPrototypeOf({ ...user, ...dto }, User.prototype);

    repo.findOneByField.mockResolvedValue(user);
    domain.ensureUniqueEmail.mockResolvedValue();
    domain.ensureUniqueUsername.mockResolvedValue();
    domain.updateUserEntity.mockResolvedValue(updated);
    repo.save.mockResolvedValue(updated);

    const result = await useCase.execute('user-1', dto);

    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'user-1',
      relations: ['roles'],
    });
    expect(domain.ensureUniqueEmail).toHaveBeenCalledWith(dto.email, 'user-1');
    expect(domain.ensureUniqueUsername).toHaveBeenCalledWith(
      dto.username,
      'user-1',
    );
    expect(domain.updateUserEntity).toHaveBeenCalledWith(user, dto);
    expect(repo.save).toHaveBeenCalledWith(updated);
    expect(result).toEqual(new UserResponseDto(updated));
    expect(logHistory.executeStructured).toHaveBeenCalled();
  });

  it('should throw if email is already used', async () => {
    repo.findOneByField.mockResolvedValue(user);
    domain.ensureUniqueEmail.mockRejectedValue(
      new UserConflictException('email'),
    );

    await expect(useCase.execute('user-1', dto)).rejects.toThrow(
      UserConflictException,
    );
  });

  it('should throw if username is already used', async () => {
    repo.findOneByField.mockResolvedValue(user);
    domain.ensureUniqueEmail.mockResolvedValue();
    domain.ensureUniqueUsername.mockRejectedValue(
      new UserConflictException('username'),
    );

    await expect(useCase.execute('user-1', dto)).rejects.toThrow(
      UserConflictException,
    );
  });

  it('should propagate repo.save error', async () => {
    repo.findOneByField.mockResolvedValue(user);
    domain.ensureUniqueEmail.mockResolvedValue();
    domain.ensureUniqueUsername.mockResolvedValue();
    domain.updateUserEntity.mockResolvedValue(user);
    repo.save.mockRejectedValue(new Error('Save failed'));

    await expect(useCase.execute('user-1', dto)).rejects.toThrow('Save failed');
  });

  it('should log structured history with old and new values', async () => {
    const originalUser = createMockUser({
      id: 'user-1',
      email: 'old@mail.com',
      username: 'old_username',
      firstName: 'Old',
      lastName: 'Name',
    });
    const updatedUser = Object.setPrototypeOf(
      { ...originalUser, ...dto },
      User.prototype,
    );

    repo.findOneByField.mockResolvedValue(originalUser);
    domain.ensureUniqueEmail.mockResolvedValue();
    domain.ensureUniqueUsername.mockResolvedValue();
    domain.updateUserEntity.mockResolvedValue(updatedUser);
    repo.save.mockResolvedValue(updatedUser);

    await useCase.execute('user-1', dto, 'admin-123');

    expect(logHistory.executeStructured).toHaveBeenCalledWith({
      entity: 'user',
      entityId: 'user-1',
      action: 'UPDATE',
      userId: 'admin-123',
      oldValue: {
        email: 'old@mail.com',
        username: 'old_username',
        firstName: 'Old',
        lastName: 'Name',
        isTwoFactorEnabled: originalUser.isTwoFactorEnabled,
        roles: [],
        isActive: originalUser.isActive,
      },
      newValue: {
        email: 'new@mail.com',
        username: 'new_username',
        firstName: 'New',
        lastName: 'User',
        isTwoFactorEnabled: updatedUser.isTwoFactorEnabled,
        roles: [],
        active: updatedUser.active,
      },
      metadata: {
        changedFields: ['email', 'username', 'firstName', 'lastName'],
        updateType: 'full_update',
        hasRoleChanges: false,
        has2faChanges: false,
      },
      ipAddress: undefined,
      userAgent: undefined,
    });
  });

  it('should log structured history with request context', async () => {
    const updated = Object.setPrototypeOf({ ...user, ...dto }, User.prototype);

    repo.findOneByField.mockResolvedValue(user);
    domain.ensureUniqueEmail.mockResolvedValue();
    domain.ensureUniqueUsername.mockResolvedValue();
    domain.updateUserEntity.mockResolvedValue(updated);
    repo.save.mockResolvedValue(updated);

    const requestContext = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    await useCase.execute('user-1', dto, 'admin-123', requestContext);

    expect(logHistory.executeStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: '192.168.1.1',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }),
    );
  });

  it('should detect role changes in metadata', async () => {
    const originalUser = createMockUser({
      id: 'user-1',
      email: 'old@mail.com',
      roles: [],
    });
    const updatedUser = Object.setPrototypeOf(
      {
        ...originalUser,
        ...dto,
        roles: [{ name: 'admin' }],
      },
      User.prototype,
    );

    repo.findOneByField.mockResolvedValue(originalUser);
    domain.ensureUniqueEmail.mockResolvedValue();
    domain.ensureUniqueUsername.mockResolvedValue();
    domain.updateUserEntity.mockResolvedValue(updatedUser);
    repo.save.mockResolvedValue(updatedUser);

    await useCase.execute('user-1', dto);

    expect(logHistory.executeStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          hasRoleChanges: true,
        }),
      }),
    );
  });

  it('should detect 2FA changes in metadata', async () => {
    const originalUser = createMockUser({
      id: 'user-1',
      email: 'old@mail.com',
      isTwoFactorEnabled: false,
    });
    const updatedUser = Object.setPrototypeOf(
      {
        ...originalUser,
        ...dto,
        isTwoFactorEnabled: true,
      },
      User.prototype,
    );

    repo.findOneByField.mockResolvedValue(originalUser);
    domain.ensureUniqueEmail.mockResolvedValue();
    domain.ensureUniqueUsername.mockResolvedValue();
    domain.updateUserEntity.mockResolvedValue(updatedUser);
    repo.save.mockResolvedValue(updatedUser);

    await useCase.execute('user-1', dto);

    expect(logHistory.executeStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          has2faChanges: true,
        }),
      }),
    );
  });

  it('should work without history logging service', async () => {
    const useCaseWithoutHistory = new UpdateUserUseCase(repo, domain);
    const updated = Object.setPrototypeOf({ ...user, ...dto }, User.prototype);

    repo.findOneByField.mockResolvedValue(user);
    domain.ensureUniqueEmail.mockResolvedValue();
    domain.ensureUniqueUsername.mockResolvedValue();
    domain.updateUserEntity.mockResolvedValue(updated);
    repo.save.mockResolvedValue(updated);

    const result = await useCaseWithoutHistory.execute('user-1', dto);

    expect(result).toEqual(new UserResponseDto(updated));
  });
});
