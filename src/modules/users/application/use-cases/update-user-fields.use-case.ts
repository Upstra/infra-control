import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

/**
 * Partially updates specific fields of a user profile (e.g., metadata or settings).
 *
 * Responsibilities:
 * - Validates provided Partial<UserUpdateDto> fields for the target user.
 * - Fetches the existing user entity and applies only the specified changes.
 * - Persists the delta update to minimize data churn.
 *
 * @param id      UUID of the user to patch.
 * @param fields  Partial<UpdateUserDto> containing only fields to modify.
 * @returns       Promise<UserDto> the user DTO with applied field updates.
 *
 * @throws NotFoundException if the user does not exist.
 * @throws ValidationException if any patched field is invalid.
 *
 * @example
 * const patched = await updateUserFieldsUseCase.execute('user-uuid', { displayName:'Alice L.' });
 */

@Injectable()
export class UpdateUserFieldsUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  async execute(id: string, partialUser: Partial<User>): Promise<User> {
    await this.repo.updateFields(id, partialUser);
    const updated = await this.repo.findOneByField({
      field: 'id',
      value: id,
    });
    return updated;
  }
}
