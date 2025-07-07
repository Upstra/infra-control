import { Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { EnsureDefaultRoleUseCase } from '@/modules/roles/application/use-cases';
import { RegisterDto } from '@/modules/auth/application/dto/register.dto';
import { User } from '../../domain/entities/user.entity';
import { UserExceptions } from '../../domain/exceptions/user.exception';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Registers a new user account with provided profile and credentials.
 *
 * Responsibilities:
 * - Validates and transforms the CreateUserDto into a user entity.
 * - Delegates to UserDomainService to persist the new user.
 * - Optionally assigns default roles and initializes 2FA if configured.
 *
 * @param dto  CreateUserDto containing email, username, password, and optional metadata.
 * @returns    Promise<UserDto> the newly created user’s DTO (sans mot de passe).
 *
 * @throws ValidationException if required fields are missing or invalid.
 *
 * @example
 * const user = await registerUserUseCase.execute({ email:'a@b.com', username:'alice', password:'••••' });
 */

export class RegisterUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly domain: UserDomainService,
    private readonly ensureDefaultRoleUseCase: EnsureDefaultRoleUseCase,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(dto: RegisterDto): Promise<User> {
    const usernameExists = await this.repo.findOneByField({
      field: 'username',
      value: dto.username,
      disableThrow: true,
    });
    if (usernameExists) throw UserExceptions.conflict('username');

    const emailExists = await this.repo.findOneByField({
      field: 'email',
      value: dto.email,
      disableThrow: true,
    });

    if (emailExists) throw UserExceptions.conflict('email');

    const role = await this.ensureDefaultRoleUseCase.execute();
    const user = await this.domain.createUserEntity(
      dto.username,
      dto.password,
      dto.email,
      role,
      dto.firstName,
      dto.lastName,
    );
    const saved = await this.repo.save(user);
    await this.logHistory?.execute('user', saved.id, 'CREATE', saved.id);
    return saved;
  }
}
