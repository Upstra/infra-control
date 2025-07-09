import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '../../domain/entities/role.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { UserExceptions } from '@/modules/users/domain/exceptions/user.exception';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { RequestContextDto } from '@/core/dto';
import { RoleExceptions } from '../../domain/exceptions/role.exception';

@Injectable()
export class UpdateUserRolesUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  /**
   * Update user roles - supports both single role toggle and multiple roles assignment
   * @param userId - The ID of the user to update
   * @param roleId - Single role ID for toggle operation (add/remove)
   * @param roleIds - Array of role IDs to assign (replaces all current roles)
   * @param currentUserId - ID of the user performing the action
   * @param requestContext - Request context for logging
   * @returns The updated user
   */
  async execute(
    userId: string,
    roleId: string | null | undefined,
    roleIds: string[] | undefined,
    currentUserId?: string,
    requestContext?: RequestContextDto,
  ): Promise<UserResponseDto> {
    if (roleId !== undefined && roleIds !== undefined) {
      throw RoleExceptions.cannotSpecifyBothRoleIdAndRoleIds();
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const roleRepo = manager.getRepository(Role);

      const user = await userRepo.findOneOrFail({
        where: { id: userId },
        relations: ['roles'],
      });

      const oldRoles =
        user.roles?.map((role) => ({
          id: role.id,
          name: role.name,
          isAdmin: role.isAdmin,
        })) ?? [];

      let operationType:
        | 'ADD_ROLE'
        | 'REMOVE_ROLE'
        | 'ASSIGN_ROLES'
        | 'ASSIGN_GUEST' = 'ASSIGN_GUEST';

      if (roleIds !== undefined) {
        await this.assignMultipleRoles(user, roleIds, roleRepo, manager);
        operationType = 'ASSIGN_ROLES';
      } else if (roleId !== undefined && roleId !== null) {
        const hadRole = this.hasRole(user, roleId);
        await this.toggleSingleRole(user, roleId, roleRepo, userRepo);
        operationType = hadRole ? 'REMOVE_ROLE' : 'ADD_ROLE';
      }

      if (!user.roles || user.roles.length === 0) {
        const guestRole = await this.getGuestRole(roleRepo);
        user.roles = [guestRole];
        operationType = 'ASSIGN_GUEST';
      }

      const saved = await userRepo.save(user);
      const newRoles =
        saved.roles?.map((role) => ({
          id: role.id,
          name: role.name,
          isAdmin: role.isAdmin,
        })) ?? [];

      await this.logHistory?.executeStructured({
        entity: 'user_role',
        entityId: userId,
        action: 'UPDATE_ROLE',
        userId: currentUserId,
        oldValue: { roles: oldRoles },
        newValue: { roles: newRoles },
        metadata: {
          operationType,
          previousRoleCount: oldRoles.length,
          newRoleCount: newRoles.length,
          isElevationToAdmin:
            !oldRoles.some((r) => r.isAdmin) && newRoles.some((r) => r.isAdmin),
          isRemovalFromAdmin:
            oldRoles.some((r) => r.isAdmin) && !newRoles.some((r) => r.isAdmin),
        },
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });

      return new UserResponseDto(saved);
    });
  }

  private async assignMultipleRoles(
    user: User,
    roleIds: string[],
    roleRepo: any,
    manager: any,
  ): Promise<void> {
    if (roleIds.length === 0) {
      user.roles = [];
      return;
    }

    const roles = await roleRepo.findByIds(roleIds);
    if (roles.length !== roleIds.length) {
      throw RoleExceptions.roleNotFound();
    }

    const currentUserIsAdmin = user.roles?.some((r) => r.isAdmin) ?? false;
    const newRolesHaveAdmin = roles.some((r) => r.isAdmin);

    if (currentUserIsAdmin && !newRolesHaveAdmin) {
      const adminCount = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.isAdmin = :isAdmin', { isAdmin: true })
        .getCount();

      if (adminCount === 1) {
        throw UserExceptions.cannotRemoveLastAdminRole();
      }
    }

    user.roles = roles;
  }

  private async toggleSingleRole(
    user: User,
    roleId: string,
    roleRepo: any,
    userRepo: any,
  ): Promise<void> {
    const targetRole = await roleRepo.findOneOrFail({ where: { id: roleId } });

    if (this.hasRole(user, roleId)) {
      await this.handleRoleRemoval(user, targetRole, userRepo);
    } else {
      user.roles = [...(user.roles || []), targetRole];
    }
  }

  private hasRole(user: User, roleId: string): boolean {
    return user.roles?.some((r) => r.id === roleId) ?? false;
  }

  private async handleRoleRemoval(
    user: User,
    role: Role,
    userRepo: any,
  ): Promise<void> {
    if (role.name === 'GUEST' && user.roles.length === 1) {
      throw RoleExceptions.cannotRemoveGuestRole();
    }

    if (role.isAdmin && (await this.isLastAdmin(user, userRepo))) {
      throw UserExceptions.cannotRemoveLastAdminRole();
    }

    user.roles = user.roles.filter((r) => r.id !== role.id);
  }

  private async isLastAdmin(user: User, userRepo: any): Promise<boolean> {
    const adminRoles = user.roles.filter((r) => r.isAdmin);
    if (adminRoles.length !== 1) return false;

    const adminCount = await userRepo
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.isAdmin = :isAdmin', { isAdmin: true })
      .getCount();

    return adminCount === 1;
  }

  private async getGuestRole(roleRepo: any): Promise<Role> {
    return roleRepo.findOneOrFail({ where: { name: 'GUEST' } });
  }
}
