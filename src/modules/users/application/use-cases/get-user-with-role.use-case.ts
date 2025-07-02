import { Inject, Injectable } from '@nestjs/common';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';

/**
 * Retrieves a user along with their assigned roles.
 *
 * Responsibilities:
 * - Loads the user entity via UserDomainService.
 * - Fetches role assignments via RoleDomainService.
 * - Combines into a UserWithRolesDto containing user data and role list.
 *
 * @param id  UUID of the user.
 * @returns   Promise<UserWithRolesDto> including user info and roles.
 *
 * @throws NotFoundException if the user does not exist.
 *
 * @example
 * const userWithRoles = await getUserWithRoleUseCase.execute('user-uuid-123');
 */

@Injectable()
export class GetUserWithRoleUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(userId: string): Promise<User | null> {
    return this.userRepository.findOneByField({
      field: 'id',
      value: userId,
      relations: ['role'],
    });
  }
}
