import { Inject, Injectable } from '@nestjs/common';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    @Inject('RoleRepositoryInterface')
    private readonly roleRepo: RoleRepositoryInterface,
  ) {}

  /**
   * Add a role to a user.
   * @param userId - The ID of the user to update.
   * @param roleId - The ID of the role to add to the user.
   * @returns The updated user.
   *
   * This method adds a new role to the user's existing roles.
   * If roleId is provided, it adds the role to the user's current roles.
   * If roleId is null, no changes are made.
   */
  async execute(
    userId: string,
    roleId: string | null,
  ): Promise<UserResponseDto> {
    const current = await this.repo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    if (roleId) {
      const role = await this.roleRepo.findOneByField({
        field: 'id',
        value: roleId,
      });

      const roleExists = current.roles?.some((r) => r.id === roleId);
      if (!roleExists) {
        current.roles = [...(current.roles || []), role];
      } else {
        current.roles = current.roles.filter((r) => r.id !== roleId);
      }
    }

    const saved = await this.repo.save(current);
    return new UserResponseDto(saved);
  }
}
