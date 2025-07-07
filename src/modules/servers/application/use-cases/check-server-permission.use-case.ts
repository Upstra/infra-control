import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ServerPermissionCheckResponseDto } from '../dto/permission-check.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { PermissionSet } from '@/modules/permissions/domain/value-objects/ permission-set.value-object';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';

/**
 * Checks if a user has a specific permission on a server.
 *
 * Responsibilities:
 * - Verify the server exists
 * - Check user's permissions for the specific server
 * - Return whether the user has the requested permission
 *
 * @param serverId   UUID of the server to check
 * @param userId     UUID of the user requesting the check
 * @param permission The permission bit to check
 * @returns          Promise<ServerPermissionCheckResponseDto>
 *
 * @throws NotFoundException if server does not exist
 */
@Injectable()
export class CheckServerPermissionUseCase {
  private readonly logger = new Logger(CheckServerPermissionUseCase.name);

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionRepo: PermissionServerRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepo: ServerRepositoryInterface,
  ) {}

  async execute(
    serverId: string,
    userId: string,
    permission: PermissionBit,
  ): Promise<ServerPermissionCheckResponseDto> {
    const server = await this.serverRepo.findOneByField({
      field: 'id',
      value: serverId,
    });

    if (!server) {
      this.logger.debug(`Server ${serverId} not found`);
      throw new NotFoundException('Server not found');
    }

    const user = await this.userRepo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    let hasPermission = false;

    if (user && user.roles && user.roles.length > 0) {
      const roleIds = user.roles.map((r) => r.id);
      this.logger.debug(`User ${userId} has roleIds ${roleIds.join(',')}`);

      const permissions = await PermissionResolver.resolveServerPermissions(
        this.permissionRepo,
        roleIds,
      );

      const permissionSet = new PermissionSet(permissions);
      const filteredPermissions = permissionSet.filterByBit(permission);

      hasPermission =
        filteredPermissions.hasGlobalAccess() ||
        filteredPermissions.getAccessibleResourceIds().includes(serverId);
    }

    this.logger.debug(
      `User ${userId} ${hasPermission ? 'has' : 'does not have'} ${permission} permission for server ${serverId}`,
    );

    return {
      hasPermission,
      userId,
      resourceId: serverId,
      resourceType: 'server',
      permission,
    };
  }
}
