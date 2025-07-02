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

      const user = await userRepo.findOneOrFail({
        where: { id: userId },
        relations: ['roles'],
      });

      if (roleId) {
        const role = await roleRepo.findOneOrFail({ where: { id: roleId } });
        if (this.hasRole(user, roleId)) {
          await this.handleRoleRemoval(user, role, userRepo);
        } else if (user.roles && user.roles.length > 0) {
          user.roles = [...user.roles, role];
        }
      }

      if (!user.roles || user.roles.length === 0) {
        user.roles = [await this.getGuestRole(roleRepo)];
      }

      const saved = await userRepo.save(user);
      return new UserResponseDto(saved);
    });
  }

  private hasRole(user: User, roleId: string): boolean {
    return user.roles?.some((r) => r.id === roleId);
  }

  private async handleRoleRemoval(user: User, role: Role, userRepo: any) {
    if (role.name === 'GUEST' && user.roles.length === 1) {
      throw new CannotRemoveGuestRoleException();
    }
    if (role.isAdmin && (await this.isLastAdmin(user, userRepo))) {
      throw new CannotRemoveLastAdminException();
    }
    user.roles = user.roles.filter((r) => r.id !== role.id);
  }

  private async isLastAdmin(user: User, userRepo: any): Promise<boolean> {
    const adminRoles = user.roles.filter((r) => r.isAdmin);
    if (adminRoles.length !== 1) return false;
    const adminCount = await userRepo.count({
      where: { roles: { isAdmin: true } },
    });
    return adminCount === 1;
  }

  private async getGuestRole(roleRepo: any): Promise<Role> {
    return roleRepo.findOneOrFail({ where: { name: 'GUEST' } });
  }
}
