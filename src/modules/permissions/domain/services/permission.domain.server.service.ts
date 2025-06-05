import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PermissionServer } from '../entities/permission.server.entity';
import { PermissionServerDto } from '../../application/dto/permission.server.dto';
import { PermissionBit } from '../value-objects/permission-bit.enum';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

@Injectable()
export class PermissionDomainServerService {
  private readonly logger = new Logger(PermissionDomainServerService.name);

  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionRepo: PermissionServerRepositoryInterface,
  ) {}

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

  async cleanupObsoletePermissions(
    roleId: string,
    existingServerIds: string[],
    permissionServerIds: string[],
  ): Promise<number> {
    const existingSet = new Set(existingServerIds);
    const obsoleteIds = permissionServerIds.filter(
      (id) => !existingSet.has(id),
    );

    if (obsoleteIds.length === 0) {
      return 0;
    }

    this.logger.warn(
      `Found ${obsoleteIds.length} obsolete server permissions for role ${roleId}. ` +
        `Obsolete server IDs: ${obsoleteIds.join(', ')}`,
    );

    await this.permissionRepo.deleteByRoleAndServerIds(roleId, obsoleteIds);

    this.logger.debug(
      `Successfully cleaned up ${obsoleteIds.length} obsolete permissions for role ${roleId}`,
    );

    return obsoleteIds.length;
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
