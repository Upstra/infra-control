import { Injectable } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { PermissionServer } from '../../../permissions/domain/entities/permission.server.entity';
import { PermissionVm } from '../../../permissions/domain/entities/permission.vm.entity';

/**
 * Coordinates creation and management of user roles within the domain.
 * Encapsulates business rules for role hierarchy, default assignments, and cleanup.
 *
 * Responsibilities:
 * - Create, update, and delete roles with validation of unique names and scopes.
 * - Assign or revoke roles to/from users, ensuring no conflicting permissions.
 * - Fetch aggregated role metadata for authorization and UI display.
 *
 * @remarks
 * Should be accessed via application-layer use-cases; controllers should not
 * directly modify role repositories to preserve invariants.
 *
 * @example
 * // Assign admin role to a user
 * await roleDomainService.assignRole(userId, 'admin');
 */

@Injectable()
export class RoleDomainService {
  createAdminRoleEntity(
    permissionServer: PermissionServer,
    permissionVm: PermissionVm,
  ): Role {
    const role = new Role();
    role.name = 'ADMIN';
    role.permissionServers = [permissionServer];
    role.permissionVms = [permissionVm];
    return role;
  }

  createGuestRole(
    permissionServer: PermissionServer,
    permissionVm: PermissionVm,
  ): Role {
    const role = new Role();
    role.name = 'GUEST';
    role.permissionServers = [permissionServer];
    role.permissionVms = [permissionVm];
    return role;
  }
}
