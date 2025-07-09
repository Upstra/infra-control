import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '../../domain/entities/role.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { CannotRemoveGuestRoleException } from '../../domain/exceptions/role.exception';
import { UserExceptions } from '@/modules/users/domain/exceptions/user.exception';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { RequestContextDto } from '@/core/dto';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logHistory?: LogHistoryUseCase,
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
    currentUserId?: string,
    requestContext?: RequestContextDto,
  ): Promise<UserResponseDto> {
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
      let operationType: 'ADD_ROLE' | 'REMOVE_ROLE' | 'ASSIGN_GUEST' =
        'ASSIGN_GUEST';
      let targetRole: Role | null = null;

      if (roleId) {
        targetRole = await roleRepo.findOneOrFail({ where: { id: roleId } });
        if (this.hasRole(user, roleId)) {
          operationType = 'REMOVE_ROLE';
          await this.handleRoleRemoval(user, targetRole, userRepo);
        } else if (user.roles && user.roles.length > 0) {
          operationType = 'ADD_ROLE';
          user.roles = [...user.roles, targetRole];
        }
      }

      if (!user.roles || user.roles.length === 0) {
        targetRole = await this.getGuestRole(roleRepo);
        user.roles = [targetRole];
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
          targetRoleName: targetRole?.name,
          targetRoleIsAdmin: targetRole?.isAdmin,
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

  private hasRole(user: User, roleId: string): boolean {
    return user.roles?.some((r) => r.id === roleId);
  }

  private async handleRoleRemoval(user: User, role: Role, userRepo: any) {
    if (role.name === 'GUEST' && user.roles.length === 1) {
      throw new CannotRemoveGuestRoleException();
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
