import { Injectable } from '@nestjs/common';
import { PermissionServer } from '../entities/permission.server.entity';
import { PermissionServerDto } from '../../application/dto/permission.server.dto';
import { PermissionBit } from '../value-objects/permission-bit.enum';

@Injectable()
export class PermissionDomainServerService {
  createFullPermissionEntity(): PermissionServer {
    const entity = new PermissionServer();
    entity.bitmask = PermissionBit.READ | PermissionBit.WRITE;
    return entity;
  }

  createReadOnlyPermissionEntity(): PermissionServer {
    const entity = new PermissionServer();
    entity.bitmask = PermissionBit.READ;
    return entity;
  }

  createPermissionEntityFromDto(dto: PermissionServerDto): PermissionServer {
    const entity = new PermissionServer();
    entity.serverId = dto.serverId;
    entity.roleId = dto.roleId;
    entity.bitmask = dto.bitmask;
    return entity;
  }

  filterObsoleteServerIds(
    existingServerIds: string[],
    permissionServerIds: string[],
  ): string[] {
    const existingSet = new Set(existingServerIds);
    return permissionServerIds.filter((id) => !existingSet.has(id));
  }

  isGlobalPermission(permission: PermissionServer): boolean {
    return !permission.serverId;
  }

  filterPermissionsByBit(
    permissions: PermissionServer[],
    requiredBit: PermissionBit,
  ): PermissionServer[] {
    return permissions.filter(
      (perm) => (perm.bitmask & requiredBit) === requiredBit,
    );
  }
}
