import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '../interfaces/role.repository.interface';
import { Role } from '../entities/role.entity';
import { User } from '@/modules/users/domain/entities/user.entity';
import {
  CannotDeleteSystemRoleException,
  CannotDeleteLastAdminRoleException,
  RoleNotFoundException,
} from '../exceptions/role.exception';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

@Injectable()
export class SafeRoleDeletionDomainService {
  private readonly logger = new Logger(SafeRoleDeletionDomainService.name);

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
    @Inject('PermissionVmRepositoryInterface')
    private readonly permissionVmRepository: PermissionVmRepositoryInterface,
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionServerRepository: PermissionServerRepositoryInterface,
  ) {}

  /**
   * Safely delete a role by:
   * 1. Checking if the role can be safely deleted (not ADMIN/GUEST system roles)
   * 2. Finding all users with this role
   * 3. Removing the role from their role list
   * 4. Assigning Guest role to users left without any roles
   * 5. Deleting all associated permissions (VM and Server)
   * 6. Deleting the role
   */
  async safelyDeleteRole(roleId: string): Promise<void> {
    this.logger.log(`Starting safe deletion of role ${roleId}`);

    const roleToDelete = await this.roleRepository.findOneByField({
      field: 'id',
      value: roleId,
    });

    if (roleToDelete.name === 'ADMIN' || roleToDelete.name === 'GUEST') {
      throw new CannotDeleteSystemRoleException(roleToDelete.name);
    }

    if (roleToDelete.isAdmin) {
      const adminRoleCount = await this.roleRepository.countAdminRoles();
      if (adminRoleCount <= 1) {
        throw new CannotDeleteLastAdminRoleException();
      }
    }

    const usersWithRole = await this.userRepository.findUsersByRole(roleId);
    this.logger.log(`Found ${usersWithRole.length} users with role ${roleId}`);

    if (usersWithRole.length > 0) {
      const updatedUsers: User[] = [];
      let guestRole: Role | null = null;

      for (const user of usersWithRole) {
        user.roles = user.roles.filter((role) => role.id !== roleId);

        if (user.roles.length === 0) {
          if (!guestRole) {
            guestRole = await this.ensureGuestRole();
          }
          user.roles = [guestRole];
          this.logger.log(
            `Assigned Guest role to user ${user.id} (${user.username})`,
          );
        }

        updatedUsers.push(user);
      }

      await Promise.all(
        updatedUsers.map((user) => this.userRepository.save(user)),
      );
      this.logger.log(`Updated ${updatedUsers.length} users`);
    }

    await this.deleteRolePermissions(roleId);

    await this.roleRepository.deleteRole(roleId);
    this.logger.log(`Successfully deleted role ${roleId}`);
  }

  /**
   * Delete all permissions associated with the role
   */
  private async deleteRolePermissions(roleId: string): Promise<void> {
    this.logger.log(`Deleting permissions for role ${roleId}`);

    try {
      await Promise.all([
        this.permissionVmRepository.deleteByRoleId(roleId),
        this.permissionServerRepository.deleteByRoleId(roleId),
      ]);
      
      this.logger.log(
        `Successfully deleted all permissions for role ${roleId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting permissions for role ${roleId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Ensure Guest role exists, create it if not
   */
  private async ensureGuestRole(): Promise<Role> {
    const existingRole = await this.roleRepository.findOneByField({
      field: 'name',
      value: 'GUEST',
    });

    if (existingRole) {
      return existingRole;
    }

    this.logger.warn('Guest role not found, creating it');
    try {
      return await this.roleRepository.createRole('GUEST');
    } catch {
      const role = await this.roleRepository.findOneByField({
        field: 'name',
        value: 'GUEST',
      });
      if (role) {
        return role;
      }
      throw new RoleNotFoundException(
        'GUEST role not found and could not be created',
      );
    }
  }
}
