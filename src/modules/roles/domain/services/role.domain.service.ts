import { Injectable } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';

@Injectable()
export class RoleDomainService {
    createAdminRole(
        permissionServer: PermissionServer,
        permissionVm: PermissionVm,
    ): Role {
        const role = new Role();
        role.name = 'ADMIN';
        role.permissionServers = role.permissionServers.concat(permissionServer);
        role.permissionVms = role.permissionVms.concat(permissionVm);
        return role;
    }

    createGuestRole(
        permissionServer: PermissionServer,
        permissionVm: PermissionVm,
    ): Role {
        const role = new Role();
        role.name = 'GUEST';
        role.permissionServers = role.permissionServers.concat(permissionServer);
        role.permissionVms = role.permissionVms.concat(permissionVm);
        return role;
    }
}
