import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '../../domain/entities/role.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { CannotRemoveGuestRoleException } from '../../domain/exceptions/role.exception';
import { CannotRemoveLastAdminException } from '@/modules/users/domain/exceptions/user.exception';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(private readonly dataSource: DataSource) {}

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
      const userRepo = manager.getRepository(User);
      const roleRepo = manager.getRepository(Role);

      const current = await userRepo.findOneOrFail({
        where: { id: userId },
        relations: ['roles'],
      });

      if (roleId) {
        const role = await roleRepo.findOneOrFail({ where: { id: roleId } });
        const roleExists = current.roles?.some((r) => r.id === roleId);

        if (roleExists) {
          if (role.name === 'GUEST' && current.roles.length === 1) {
            throw new CannotRemoveGuestRoleException();
          }
          if (role.isAdmin) {
            const adminRoles = current.roles.filter((r) => r.isAdmin);
            if (
              adminRoles.length === 1 &&
              (await userRepo.count({
                where: { roles: { isAdmin: true } },
              })) === 1
            ) {
              throw new CannotRemoveLastAdminException();
            }
          }
          current.roles = current.roles.filter((r) => r.id !== roleId);
        } else {
          if (current.roles && current.roles.length > 0) {
            current.roles = [...current.roles, role];
          }
        }
      }

      if (!current.roles || current.roles.length === 0) {
        const guest = await roleRepo.findOneOrFail({
          where: { name: 'GUEST' },
        });
        current.roles = [guest];
      }

      const saved = await userRepo.save(current);
      return new UserResponseDto(saved);
    });
  }
}
