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

    const roleId = user?.roles?.[0]?.id;
    if (!roleId) {
      this.logger.debug(`User ${userId} has no role assigned`);
      throw new ForbiddenException('User has no role assigned');
    }

    this.logger.debug(`User ${userId} has roleId ${roleId}`);

    const permissions = await this.permissionRepo.findAllByField({
      field: 'roleId',
      value: roleId,
    });

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
