import { Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { UserCreateDto } from '../dto/user.create.dto';
import { User } from '../../domain/entities/user.entity';
import { UserExceptions } from '../../domain/exceptions/user.exception';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { SendAccountCreatedEmailUseCase } from '@/modules/email/application/use-cases/send-account-created-email.use-case';

/**
 * Creates a new user account by an administrator with specified roles.
 *
 * @param dto UserCreateDto containing user details and optional role IDs
 * @param adminId ID of the admin user creating the account
 * @returns Promise<User> the newly created user with roles
 */
export class CreateUserByAdminUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
    @Inject('RoleRepositoryInterface')
    private readonly roleRepo: RoleRepositoryInterface,
    private readonly userDomainService: UserDomainService,
    private readonly logHistory?: LogHistoryUseCase,
    private readonly sendAccountCreatedEmailUseCase?: SendAccountCreatedEmailUseCase,
  ) {}

  async execute(dto: UserCreateDto, adminId: string): Promise<User> {
    const usernameExists = await this.userRepo.findOneByField({
      field: 'username',
      value: dto.username,
      disableThrow: true,
    });
    if (usernameExists) throw UserExceptions.conflict('username');

    const emailExists = await this.userRepo.findOneByField({
      field: 'email',
      value: dto.email,
      disableThrow: true,
    });
    if (emailExists) throw UserExceptions.conflict('email');

    let roles: Role[] = [];
    if (dto.roleIds?.length) {
      roles = await this.roleRepo.findByIds(dto.roleIds);
      if (roles.length !== dto.roleIds.length) {
        throw UserExceptions.badRequest('One or more role IDs are invalid');
      }
    }

    const user = await this.userDomainService.createUserEntity(
      dto.username,
      dto.password,
      dto.email,
      roles[0],
      dto.firstName,
      dto.lastName,
    );

    if (roles.length > 1) {
      user.roles = roles;
    }

    const saved = await this.userRepo.save(user);
    await this.logHistory?.execute('user', saved.id, 'CREATE', adminId);

    await this.sendAccountCreatedEmailUseCase?.execute(
      saved.email,
      saved.firstName || saved.username,
    );

    return this.userRepo.findById(saved.id);
  }
}