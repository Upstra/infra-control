import { Injectable } from '@nestjs/common';
import { PermissionServer } from '../entities/permission.server.entity';
import { PermissionServerDto } from '../../application/dto/permission.server.dto';
import { PermissionBit } from '../value-objects/permission-bit.enum';

/**
 * Enforces and evaluates fine-grained permissions for server entities in the domain.
 * Centralizes RBAC rules and guards server operations based on user roles.
 *
 * Responsibilities:
 * - Determine if a given user may perform CRUD or power actions on a server.
 * - Aggregate permissions from roles, groups, and custom overrides.
 * - Throw domain exceptions when unauthorized access is attempted.
 *
 * @remarks
 * This service must be invoked by application-layer orchestrators/use-cases to protect
 * server operations. Controllers should not directly call repositories for permission checks.
 *
 * @param userId    Identifier of the acting user.
 * @param serverId  Identifier of the target server.
 *
 * @example
 * // Check if user can reboot a server
 * if (!await permissionServerService.canReboot(userId, serverId)) {
 *   throw new UnauthorizedServerOperationException();
 * }
 */

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
