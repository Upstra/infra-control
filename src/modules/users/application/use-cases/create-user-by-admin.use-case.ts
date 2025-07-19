import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { UserCreateDto } from '../dto/user.create.dto';
import { User } from '../../domain/entities/user.entity';
import {
  UserBadRequestException,
  UserConflictException,
} from '../../domain/exceptions/user.exception';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { EmailEventType } from '@/modules/email/domain/events/email.events';
import { IUserPreferencesRepository } from '@/modules/user-preferences/domain/interfaces/user-preferences.repository.interface';
import { UserPreference } from '@/modules/user-preferences/domain/entities/user-preference.entity';

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
    private readonly eventEmitter: EventEmitter2,
    @Inject('IUserPreferencesRepository')
    private readonly userPreferencesRepository?: IUserPreferencesRepository,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(dto: UserCreateDto, adminId: string): Promise<User> {
    const usernameExists = await this.userRepo.findOneByField({
      field: 'username',
      value: dto.username,
      disableThrow: true,
    });
    if (usernameExists) throw new UserConflictException('username');

    const emailExists = await this.userRepo.findOneByField({
      field: 'email',
      value: dto.email,
      disableThrow: true,
    });
    if (emailExists) throw new UserConflictException('email');

    let roles: Role[] = [];
    if (dto.roleIds?.length) {
      roles = await this.roleRepo.findByIds(dto.roleIds);
      if (roles.length !== dto.roleIds.length) {
        throw new UserBadRequestException('One or more role IDs are invalid');
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

    if (this.userPreferencesRepository) {
      const defaultPreferences = UserPreference.createDefault(saved.id);
      await this.userPreferencesRepository.create(defaultPreferences);
    }

    await this.logHistory?.execute('user', saved.id, 'CREATE', adminId);

    this.eventEmitter.emit(EmailEventType.ACCOUNT_CREATED, {
      email: saved.email,
      firstname: saved.firstName || saved.username,
    });

    return this.userRepo.findById(saved.id);
  }
}
