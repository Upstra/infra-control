import { Injectable, Inject, Logger } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerListResponseDto } from '../dto/server.list.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { PermissionSet } from '@/modules/permissions/domain/value-objects/ permission-set.value-object';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';
import { GetServerStatusUseCase } from '@/modules/ilos/application/use-cases/get-server-status.use-case';
import { IloStatusResponseDto } from '@/modules/ilos/application/dto/ilo-status.dto';
import { ServerMetricsExtendedDto } from '../dto/server-metrics-extended.dto';

/**
 * Retrieves all servers assigned or accessible to a given user with optional iLO metrics.
 *
 * Responsibilities:
 * - Determines the set of servers the user can view (via roles/groups).
 * - Loads each permitted server entity from the domain service.
 * - Optionally enriches servers with iLO metrics (power state, health, etc.)
 * - Returns a paginated array of ServerDto filtered by user scope.
 *
 * @param userId  UUID of the user whose servers to fetch.
 * @param page    Page number for pagination.
 * @param limit   Number of items per page.
 * @param includeMetrics Whether to include iLO metrics for each server.
 * @returns       Promise<ServerListResponseDto> paginated array of accessible server DTOs.
 *
 * @remarks
 * Ideal for "My Servers" views with metrics; enforces domain authorization rules.
 *
 * @example
 * const myServers = await getUserServersWithMetricsUseCase.execute('user-uuid', 1, 10, true);
 */

@Injectable()
export class GetUserServersWithMetricsUseCase {
  private readonly logger = new Logger(GetUserServersWithMetricsUseCase.name);

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionRepo: PermissionServerRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepo: ServerRepositoryInterface,
    private readonly getServerStatusUseCase: GetServerStatusUseCase,
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 10,
    includeMetrics: boolean = false,
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

    const isAdmin = user?.roles?.some((role) => role.isAdmin) ?? false;
    if (isAdmin) {
      try {
        const servers = await this.serverRepo.findAll();
        const totalCount = servers.length;

        const skip = (page - 1) * limit;
        const paginatedServers = servers.slice(skip, skip + limit);

        const serversResponse = await this.enrichServersWithMetrics(
          paginatedServers.map((s) => ServerResponseDto.fromEntity(s)),
          includeMetrics,
        );

        return new ServerListResponseDto(
          serversResponse,
          totalCount,
          page,
          limit,
        );
      } catch (error) {
        this.logger.error(`Unexpected error for admin user: ${error.message}`);
        return new ServerListResponseDto([], 0, page, limit);
      }
    }

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

      const serversResponse = await this.enrichServersWithMetrics(
        servers.map((s) => ServerResponseDto.fromEntity(s)),
        includeMetrics,
      );

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

  private async enrichServersWithMetrics(
    servers: ServerResponseDto[],
    includeMetrics: boolean,
  ): Promise<ServerResponseDto[]> {
    if (!includeMetrics) {
      return servers;
    }

    const enrichedServers = await Promise.all(
      servers.map(async (server) => {
        try {
          if (!server.ilo) {
            return server;
          }

          const iloStatus = await this.getServerStatusUseCase.execute(
            server.id,
            false,
          );

          return {
            ...server,
            metrics: this.mapIloStatusToMetrics(iloStatus),
          };
        } catch (error) {
          this.logger.warn(
            `Failed to fetch metrics for server ${server.id}: ${error.message}`,
          );
          return server;
        }
      }),
    );

    return enrichedServers;
  }

  private mapIloStatusToMetrics(
    iloStatus: IloStatusResponseDto,
  ): ServerMetricsExtendedDto {
    return {
      powerState: iloStatus.metrics.powerState || 'unknown',
      health: (iloStatus.metrics as any).health || 'unknown',
      temperature: (iloStatus.metrics as any).temperature || {},
      fanStatus: (iloStatus.metrics as any).fanStatus || {},
      powerSupplyStatus: (iloStatus.metrics as any).powerSupplyStatus || {},
      cpuUsage: iloStatus.metrics.cpuUsage,
      memoryUsage: iloStatus.metrics.memoryUsage,
      lastUpdated:
        (iloStatus.metrics as any).lastUpdated || new Date().toISOString(),
    };
  }
}
