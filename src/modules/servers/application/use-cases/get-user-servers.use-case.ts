import { Injectable, Inject, Logger } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerListResponseDto } from '../dto/server.list.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { PermissionSet } from '@/modules/permissions/domain/value-objects/ permission-set.value-object';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';

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

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ServerListResponseDto> {
    const user = await this.userRepo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    const roleIds = user?.roles?.map((r) => r.id) ?? [];
    if (!roleIds.length) {
      this.logger.debug(`User ${userId} has no role assigned`);
      return new ServerListResponseDto([], 0, page, limit);
    }

    this.logger.debug(`User ${userId} has roleIds ${roleIds.join(',')}`);

    const permissions = await PermissionResolver.resolveServerPermissions(
      this.permissionRepo,
      roleIds,
    );

    this.logger.debug(`User ${userId} has ${permissions.length} permissions`);

    const permissionSet = new PermissionSet(permissions);
    const readablePermissions = permissionSet.filterByBit(PermissionBit.READ);

    const serverIds = readablePermissions.getAccessibleResourceIds();

    if (!serverIds.length) {
      this.logger.debug(
        `User ${userId} has no readable permissions or permissions only with null serverId`,
      );
      return new ServerListResponseDto([], 0, page, limit);
    }

    try {
      const [servers, totalCount] =
        await this.serverRepo.findAllByFieldPaginated(
          {
            field: 'id',
            value: serverIds,
            relations: ['ilo'],
          },
          page,
          limit,
        );

      this.logger.debug(
        `User ${userId} has access to ${servers.length} servers (total: ${totalCount})`,
      );
      this.logger.debug(`Servers: ${JSON.stringify(servers)}`);

      const serversResponse = servers.map((s) =>
        ServerResponseDto.fromEntity(s),
      );

      this.logger.debug(`User ${userId} has servers ${serversResponse}`);

      return new ServerListResponseDto(
        serversResponse,
        totalCount,
        page,
        limit,
      );
    } catch (error) {
      this.logger.error(`Unexpected error: ${error.message}`);
      return new ServerListResponseDto([], 0, page, limit);
    }
  }
}
