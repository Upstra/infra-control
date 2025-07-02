import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '../interfaces/role.repository.interface';
import { Role } from '../entities/role.entity';
import { User } from '@/modules/users/domain/entities/user.entity';

@Injectable()
export class SafeRoleDeletionDomainService {
  private readonly logger = new Logger(SafeRoleDeletionDomainService.name);

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  /**
   * Safely delete a role by:
   * 1. Finding all users with this role
   * 2. Removing the role from their role list
   * 3. Assigning Guest role to users left without any roles
   * 4. Deleting the role
   */
  async safelyDeleteRole(roleId: string): Promise<void> {
    this.logger.log(`Starting safe deletion of role ${roleId}`);

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

    await this.roleRepository.deleteRole(roleId);
    this.logger.log(`Successfully deleted role ${roleId}`);
  }

  /**
   * Ensure Guest role exists, create it if not
   */
  private async ensureGuestRole(): Promise<Role> {
    try {
      return await this.roleRepository.findOneByField({
        field: 'name',
        value: 'GUEST',
      });
    } catch {
      this.logger.warn('Guest role not found, creating it');
      const guestRole = await this.roleRepository.createRole('GUEST');
      return await this.roleRepository.save(guestRole);
    }
  }
}
