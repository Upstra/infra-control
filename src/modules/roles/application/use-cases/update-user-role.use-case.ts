import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { CannotRemoveGuestRoleException } from '../../domain/exceptions/role.exception';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    @Inject('RoleRepositoryInterface')
    private readonly roleRepo: RoleRepositoryInterface,
    private readonly dataSource: DataSource,
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
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.withRepository
        ? manager.withRepository(this.repo as any)
        : (this.repo as any);
      const roleRepo = manager.withRepository
        ? manager.withRepository(this.roleRepo as any)
        : (this.roleRepo as any);

      const current = await userRepo.findOneByField({
        field: 'id',
        value: userId,
        relations: ['roles'],
      });

      if (roleId) {
        const role = await roleRepo.findOneByField({
          field: 'id',
          value: roleId,
        });

        const roleExists = current.roles?.some((r) => r.id === roleId);
        if (!roleExists) {
          current.roles = [...(current.roles || []), role];
        } else {
          if (role.name === 'GUEST' && current.roles.length === 1) {
            throw new CannotRemoveGuestRoleException();
          }
          current.roles = current.roles.filter((r) => r.id !== roleId);
          if (current.roles.length === 0) {
            const guest = await roleRepo.findOneByField({
              field: 'name',
              value: 'GUEST',
            });
            current.roles = [guest];
          }
        }
      }

      const saved = await userRepo.save(current);
      return new UserResponseDto(saved);
    });
  }
}
