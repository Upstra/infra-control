import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserUpdateDto } from '../dto/user.update.dto';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { User } from '../../domain/entities/user.entity';
import { RequestContextDto } from '@/core/dto';

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
    requestContext?: RequestContextDto,
  ): Promise<UserResponseDto> {
    let user = await this.repo.findOneByField({
      field: 'id',
      value: id,
      relations: ['roles'],
    });

    const oldUserData = this.extractUserData(user);

    await this.userDomainService.ensureUniqueEmail(dto.email, id);
    await this.userDomainService.ensureUniqueUsername(dto.username, id);

    user = await this.userDomainService.updateUserEntity(user, dto);
    user = await this.repo.save(user);

    if (!userId) {
      userId = user.id;
    }

    const newUserData = this.extractUserData(user);
    const changedFields = this.getChangedFields(oldUserData, newUserData);

    await this.logHistory?.executeStructured({
      entity: 'user',
      entityId: user.id,
      action: 'UPDATE',
      userId,
      oldValue: oldUserData,
      newValue: newUserData,
      metadata: {
        changedFields,
        updateType: 'full_update',
        hasRoleChanges: changedFields.includes('roles'),
        has2faChanges: changedFields.includes('isTwoFactorEnabled'),
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    return new UserResponseDto(user);
  }

  private extractUserData(user: User): Record<string, any> {
    return {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      roles: user.roles?.map((role) => role.name) ?? [],
      active: user.active,
    };
  }

  private getChangedFields(
    oldData: Record<string, any>,
    newData: Record<string, any>,
  ): string[] {
    const changedFields: string[] = [];

    for (const key in newData) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }
}
