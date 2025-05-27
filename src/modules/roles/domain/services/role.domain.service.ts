import { Injectable } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { PermissionServer } from '../../../permissions/domain/entities/permission.server.entity';
import { PermissionVm } from '../../../permissions/domain/entities/permission.vm.entity';

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
