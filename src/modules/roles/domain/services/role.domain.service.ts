import { Injectable } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { PermissionServer } from '../../../permissions/domain/entities/permission.server.entity';
import { PermissionVm } from '../../../permissions/domain/entities/permission.vm.entity';
import { RoleCreationDto } from '../../application/dto';
import { AdminRoleCreationDto } from '../../application/dto/role.creation.dto';
import { RoleUpdateDto } from '../../application/dto/role.update.dto';

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

  toRoleEntity(dto: RoleCreationDto | AdminRoleCreationDto): Role {
    const role = new Role();
    role.name = dto.name;
    if (dto instanceof AdminRoleCreationDto) {
      role.isAdmin = dto.isAdmin;
      role.canCreateServer = dto.canCreateServer;
    }
    return role;
  }

  updateRoleEntity(entity: Role, dto: RoleUpdateDto): Role {
    if (dto.name) {
      entity.name = dto.name;
    }
    if (dto.isAdmin !== undefined) {
      entity.isAdmin = dto.isAdmin;
    }
    if (dto.canCreateServer !== undefined) {
      entity.canCreateServer = dto.canCreateServer;
    }
    return entity;
  }
}
