import { Injectable, Inject, Logger } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ServerResponseDto } from '../dto/server.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { PermissionSet } from '@/modules/permissions/domain/value-objects/ permission-set.value-object';

/**
 * Retrieves all servers assigned or accessible to a given user.
 *
 * Responsibilities:
 * - Determines the set of servers the user can view (via roles/groups).
 * - Loads each permitted server entity from the domain service.
 * - Returns an array of ServerDto filtered by user scope.
 *
 * @param userId  UUID of the user whose servers to fetch.
 * @returns       Promise<ServerDto[]> array of accessible server DTOs.
 *
 * @remarks
 * Ideal for “My Servers” views; enforces domain authorization rules.
 *
 * @example
 * const myServers = await getUserServersUseCase.execute('user-uuid');
 */

@Injectable()
export class GetUserServersUseCase {
  private readonly logger = new Logger(GetUserServersUseCase.name);

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionRepo: PermissionServerRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepo: ServerRepositoryInterface,
  ) {}

  async execute(userId: string): Promise<ServerResponseDto[]> {
    const user = await this.userRepo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['role'],
    });

    if (!user?.roleId) {
      this.logger.debug(`User ${userId} has no role assigned`);
      return [];
    }

    this.logger.debug(`User ${userId} has roleId ${user.roleId}`);

    const permissions = await this.permissionRepo.findAllByField({
      field: 'roleId',
      value: user.roleId,
    });

    this.logger.debug(`User ${userId} has ${permissions.length} permissions`);

    const permissionSet = new PermissionSet(permissions);
    const readablePermissions = permissionSet.filterByBit(PermissionBit.READ);

    const serverIds = readablePermissions.getAccessibleResourceIds();

    if (!serverIds.length) {
      this.logger.debug(
        `User ${userId} has no readable permissions or permissions only with null serverId`,
      );
      return [];
    }

    try {
      const servers = await this.serverRepo.findAllByField({
        field: 'id',
        value: serverIds,
        relations: ['ilo'],
      });

      this.logger.debug(
        `User ${userId} has access to ${servers.length} servers`,
      );
      this.logger.debug(`Servers: ${JSON.stringify(servers)}`);

      const serversResponse = servers.map((s) =>
        ServerResponseDto.fromEntity(s),
      );

      this.logger.debug(`User ${userId} has servers ${serversResponse}`);

      return serversResponse;
    } catch (error) {
      this.logger.error(`Unexpected error: ${error.message}`);
      return [];
    }
  }
}
