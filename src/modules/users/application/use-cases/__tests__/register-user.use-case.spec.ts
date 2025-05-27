import { RegisterUserUseCase } from '../register-user.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import { EnsureDefaultRoleUseCase } from '@/modules/roles/application/use-cases';
import { RegisterDto } from '@/modules/auth/application/dto/register.dto';
import { UserConflictException } from '@/modules/users/domain/exceptions/user.exception';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let domain: jest.Mocked<UserDomainService>;
  let ensureDefaultRoleUseCase: jest.Mocked<EnsureDefaultRoleUseCase>;

  const dto: RegisterDto = {
    email: 'john.doe@example.com',
    username: 'john_doe',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(() => {
    repo = {
      findOneByField: jest.fn(),
      save: jest.fn(),
    } as any;

    domain = {
      createUserEntity: jest.fn(),
    } as any;

    ensureDefaultRoleUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new RegisterUserUseCase(repo, domain, ensureDefaultRoleUseCase);
  });

  it('should throw UserConflictException if username already exists', async () => {
    repo.findOneByField.mockResolvedValueOnce(createMockUser());

    await expect(useCase.execute(dto)).rejects.toThrow(UserConflictException);
    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'username',
      value: dto.username,
      disableThrow: true,
    });
  });

  it('should throw UserConflictException if email already exists', async () => {
    repo.findOneByField
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createMockUser());

    await expect(useCase.execute(dto)).rejects.toThrow(UserConflictException);
    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'email',
      value: dto.email,
      disableThrow: true,
    });
  });

  it('should create user successfully if username and email are free', async () => {
    repo.findOneByField.mockResolvedValue(null);
    const role = createMockRole();
    const user = createMockUser();
    ensureDefaultRoleUseCase.execute.mockResolvedValue(role);
    domain.createUserEntity.mockResolvedValue(user);
    repo.save.mockResolvedValue(user);

    const result = await useCase.execute(dto);

    expect(ensureDefaultRoleUseCase.execute).toHaveBeenCalled();
    expect(domain.createUserEntity).toHaveBeenCalledWith(
      dto.username,
      dto.password,
      dto.email,
      role,
      dto.firstName,
      dto.lastName,
    );
    expect(repo.save).toHaveBeenCalledWith(user);
    expect(result).toBe(user);
  });

  it('should propagate repository error', async () => {
    repo.findOneByField.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute(dto)).rejects.toThrow('DB Error');
  });
});
