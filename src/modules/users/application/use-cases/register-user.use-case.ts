import { Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { EnsureDefaultRoleUseCase } from '@/modules/roles/application/use-cases';
import { RegisterDto } from '@/modules/auth/application/dto/register.dto';
import { User } from '../../domain/entities/user.entity';
import {
  UserConflictException,
  UserRegistrationException,
} from '../../domain/exceptions/user.exception';

export class RegisterUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly domain: UserDomainService,
    private readonly ensureDefaultRoleUseCase: EnsureDefaultRoleUseCase,
  ) {}

  async execute(dto: RegisterDto): Promise<User> {
    const usernameExists = await this.repo.findOneByField(
      'username',
      dto.username,
    );
    if (usernameExists)
      throw new UserConflictException('Nom d’utilisateur déjà utilisé');

    const emailExists = await this.repo.findOneByField('email', dto.email);
    if (emailExists) throw new UserConflictException('Email déjà utilisé');

    const role = await this.ensureDefaultRoleUseCase.execute();
    const user = await this.domain.createUserEntity(
      dto.username,
      dto.password,
      dto.email,
      role,
      dto.firstName,
      dto.lastName,
    );

    try {
      return this.repo.save(user);
    } catch (e) {
      if (e instanceof UserConflictException) {
        throw e;
      }
      throw new UserRegistrationException();
    }
  }
}
