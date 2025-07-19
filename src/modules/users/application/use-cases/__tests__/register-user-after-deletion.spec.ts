import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from '../register-user.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import { EnsureDefaultRoleUseCase } from '@/modules/roles/application/use-cases';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { RegisterDto } from '@/modules/auth/application/dto/register.dto';

describe('RegisterUserUseCase - After Deletion', () => {
  let useCase: RegisterUserUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let domainService: jest.Mocked<UserDomainService>;
  let ensureDefaultRoleUseCase: jest.Mocked<EnsureDefaultRoleUseCase>;

  const defaultRole = createMockRole({ name: 'User' });
  const registerDto: RegisterDto = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: UserDomainService,
          useValue: {
            createUserEntity: jest.fn(),
          },
        },
        {
          provide: EnsureDefaultRoleUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: 'IUserPreferencesRepository',
          useValue: null,
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    repo = module.get('UserRepositoryInterface');
    domainService = module.get(UserDomainService);
    ensureDefaultRoleUseCase = module.get(EnsureDefaultRoleUseCase);
  });

  it('should allow registration with email/username that was previously soft deleted', async () => {
    const newUser = createMockUser({
      ...registerDto,
      roles: [defaultRole],
    });

    repo.findOneByField.mockResolvedValue(null);
    ensureDefaultRoleUseCase.execute.mockResolvedValue(defaultRole);
    domainService.createUserEntity.mockResolvedValue(newUser);
    repo.save.mockResolvedValue(newUser);

    const result = await useCase.execute(registerDto);

    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'username',
      value: 'testuser',
      disableThrow: true,
    });
    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'email',
      value: 'test@example.com',
      disableThrow: true,
    });
    expect(domainService.createUserEntity).toHaveBeenCalledWith(
      'testuser',
      'password123',
      'test@example.com',
      defaultRole,
      'Test',
      'User',
    );
    expect(result).toEqual(newUser);
  });

  it('should successfully register user when deleted user had anonymized data', async () => {
    const timestamp = Date.now();
    const deletedUser = createMockUser({
      id: 'old-user-id',
      email: `deleted_${timestamp}_old-user-id@deleted.local`,
      username: `deleted_${timestamp}_old-user-id`,
      deletedAt: new Date(),
      isActive: false,
    });

    const newUser = createMockUser({
      ...registerDto,
      roles: [defaultRole],
    });

    repo.findOneByField.mockResolvedValue(null);
    ensureDefaultRoleUseCase.execute.mockResolvedValue(defaultRole);
    domainService.createUserEntity.mockResolvedValue(newUser);
    repo.save.mockResolvedValue(newUser);

    const result = await useCase.execute(registerDto);

    expect(result.email).toBe('test@example.com');
    expect(result.username).toBe('testuser');
    expect(result.deletedAt).toBeUndefined();
    expect(result.isActive).toBe(true);
  });
});