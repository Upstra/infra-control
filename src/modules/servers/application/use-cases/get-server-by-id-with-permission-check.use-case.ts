import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ServerResponseDto } from '../dto/server.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { PermissionSet } from '@/modules/permissions/domain/value-objects/ permission-set.value-object';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';

/**
 * Retrieves a server only if the user has the required permissions.
 *
 * Responsibilities:
 * - Delegates to PermissionDomainServerService to verify read access.
 * - If allowed, loads the server entity via ServerDomainService.
 * - Maps entity to ServerDto for response.
 *
 * @param id      UUID of the server to fetch.
 * @param userId  UUID of the user requesting the data.
 * @returns       Promise<ServerDto> DTO representing the server.
 *
 * @throws NotFoundException if server does not exist.
 * @throws ForbiddenException if user is unauthorized.
 *
 * @example
 * const srv = await getServerByIdWithPermissionCheckUseCase.execute('srv-id','user-id');
 */

@Injectable()
export class GetServerByIdWithPermissionCheckUseCase {
  private readonly logger = new Logger(
    GetServerByIdWithPermissionCheckUseCase.name,
  );

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionRepo: PermissionServerRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepo: ServerRepositoryInterface,
  ) {}

  async execute(serverId: string, userId: string): Promise<ServerResponseDto> {
    const user = await this.userRepo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    const roleIds = user?.roles?.map((r) => r.id) ?? [];
    if (!roleIds.length) {
      this.logger.debug(`User ${userId} has no role assigned`);
      throw new ForbiddenException('User has no role assigned');
    }

    const permissions = await PermissionResolver.resolveServerPermissions(
      this.permissionRepo,
      roleIds,
    );

    this.logger.debug(`User ${userId} has ${permissions.length} permissions`);

    const permissionSet = new PermissionSet(permissions);
    const readablePermissions = permissionSet.filterByBit(PermissionBit.READ);

    const accessibleServerIds = readablePermissions.getAccessibleResourceIds();

    if (!accessibleServerIds.includes(serverId)) {
      this.logger.debug(
        `User ${userId} does not have READ permission for server ${serverId}`,
      );
      throw new ForbiddenException('Access denied to this server');
    }

    const server = await this.serverRepo.findOneByField({
      field: 'id',
      value: serverId,
      relations: ['ilo'],
    });

    if (!server) {
      this.logger.debug(`Server ${serverId} not found`);
      throw new NotFoundException('Server not found');
    }

    this.logger.debug(
      `User ${userId} successfully accessed server ${serverId}`,
    );

    return ServerResponseDto.fromEntity(server);
  }
}
