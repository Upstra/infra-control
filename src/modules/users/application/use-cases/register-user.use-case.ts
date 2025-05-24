import { Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { EnsureDefaultRoleUseCase } from '@/modules/roles/application/use-cases';
import { RegisterDto } from '@/modules/auth/application/dto/register.dto';
import { User } from '../../domain/entities/user.entity';
import { UserConflictException } from '../../domain/exceptions/user.exception';

export class RegisterUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly domain: UserDomainService,
    private readonly ensureDefaultRoleUseCase: EnsureDefaultRoleUseCase,
  ) {}

  async execute(dto: RegisterDto): Promise<User> {
    const usernameExists = await this.repo.findOneByField({
      field: 'username',
      value: dto.username,
      disableThrow: true,
    });
    if (usernameExists) throw new UserConflictException('username');

    const emailExists = await this.repo.findOneByField({
      field: 'email',
      value: dto.email,
      disableThrow: true,
    });

    if (emailExists) throw new UserConflictException('email');

    const role = await this.ensureDefaultRoleUseCase.execute();
    const user = await this.domain.createUserEntity(
      dto.username,
      dto.password,
      dto.email,
      role,
      dto.firstName,
      dto.lastName,
    );
    return await this.repo.save(user);
  }
}
