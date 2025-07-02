import { UpdateUserUseCase } from '../update-user.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import { UserUpdateDto } from '../../dto/user.update.dto';
import { User } from '@/modules/users/domain/entities/user.entity';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { UserResponseDto } from '../../dto/user.response.dto';
import { UserConflictException, CannotDeleteLastAdminException } from '@/modules/users/domain/exceptions/user.exception';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let roleRepo: jest.Mocked<RoleRepositoryInterface>;
  let domain: jest.Mocked<UserDomainService>;

  const user = createMockUser({ id: 'user-1', email: 'old@mail.com' });

  const dto: UserUpdateDto = {
    email: 'new@mail.com',
    username: 'new_username',
    firstName: 'New',
    lastName: 'User',
    roleId: 'role-123',
  };

  beforeEach(() => {
    repo = {
      findOneByField: jest.fn(),
      save: jest.fn(),
      countAdmins: jest.fn(),
    } as any;

    roleRepo = { findOneByField: jest.fn() } as any;

    domain = {
      ensureUniqueEmail: jest.fn(),
      ensureUniqueUsername: jest.fn(),
      updateUserEntity: jest.fn(),
    } as any;

    useCase = new UpdateUserUseCase(repo, roleRepo, domain);
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

  it('should throw if demoting the last admin', async () => {
    const adminUser = createMockUser({ roles: [createMockRole({ isAdmin: true })] });
    repo.findOneByField.mockResolvedValue(adminUser);
    repo.countAdmins.mockResolvedValue(1);
    roleRepo.findOneByField.mockResolvedValue(createMockRole({ isAdmin: false }));
    domain.ensureUniqueEmail.mockResolvedValue();
    domain.ensureUniqueUsername.mockResolvedValue();

    await expect(useCase.execute('user-1', dto)).rejects.toThrow(
      CannotDeleteLastAdminException,
    );
    expect(domain.updateUserEntity).not.toHaveBeenCalled();
  });
});
