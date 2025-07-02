import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserUpdateDto } from '../dto/user.update.dto';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Updates all modifiable attributes of an existing user.
 *
 * Responsibilities:
 * - Validates the UpdateUserDto for completeness (email, username, roles).
 * - Checks user existence and permission via UserDomainService.
 * - Applies updates and persists the full user record.
 *
 * @param id   UUID of the user to update.
 * @param dto  UpdateUserDto containing new email, username, roles, and 2FA settings.
 * @returns    Promise<UserDto> the updated user DTO reflecting all changes.
 *
 * @throws NotFoundException if the user does not exist.
 * @throws ValidationException if any updated field is invalid.
 *
 * @example
 * const updated = await updateUserUseCase.execute('user-uuid', { email:'new@b.com', roles:['tech'] });
 */

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly userDomainService: UserDomainService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    dto: UserUpdateDto,
    userId?: string,
  ): Promise<UserResponseDto> {
    let user = await this.repo.findOneByField({
      field: 'id',
      value: id,
      relations: ['roles'],
    });

    await this.userDomainService.ensureUniqueEmail(dto.email, id);
    await this.userDomainService.ensureUniqueUsername(dto.username, id);

    user = await this.userDomainService.updateUserEntity(user, dto);
    user = await this.repo.save(user);

    if (!userId) {
      userId = user.id;
    }

    await this.logHistory?.execute('user', user.id, 'UPDATE', userId);
    return new UserResponseDto(user);
  }
}
