import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';

import { ServerDomainService } from '@/modules/servers/domain/services/server.domain.service';
import { CreateIloUseCase } from '@/modules/ilos/application/use-cases';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerResponseDto } from '../dto/server.response.dto';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';
import { IGroupRepository } from '@/modules/groups/domain/interfaces/group.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { UpsRepositoryInterface } from '@/modules/ups/domain/interfaces/ups.repository.interface';
import { RequestContextDto } from '@/core/dto';

/**
 * Creates a new server record and optionally provisions initial VMs.
 *
 * Responsibilities:
 * - Validates CreateServerDto fields (hostname, roomId, ilo credentials).
 * - Invokes ServerDomainService to instantiate the server aggregate.
 * - Handles initial power-on via ILO if requested.
 * - Persists and returns the new ServerDto.
 *
 * @param dto  CreateServerDto containing server attributes.
 * @returns    Promise<ServerDto> of the created server.
 *
 * @throws ValidationException if input data is invalid.
 *
 * @example
 * const srv = await createServerUseCase.execute({ hostname:'srv1', roomId:'r1' });
 */

@Injectable()
export class CreateServerUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly createIloUsecase: CreateIloUseCase,
    private readonly serverDomain: ServerDomainService,
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: IGroupRepository,
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionRepository: PermissionServerRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    dto: ServerCreationDto,
    userId: string,
    requestContext?: RequestContextDto,
  ): Promise<ServerResponseDto> {
    const room = await this.roomRepository.findRoomById(dto.roomId);
    let ups = null;
    let group = null;

    if (dto.upsId) {
      ups = await this.upsRepository.findUpsById(dto.upsId);
      if (ups.roomId !== dto.roomId) {
        throw new BadRequestException(
          "L'UPS sélectionné n'appartient pas à la salle spécifiée",
        );
      }
    }

    if (dto.groupId) {
      group = await this.groupRepository.findById(dto.groupId);
    }

    const ilo = await this.createIloUsecase.execute(dto.ilo);
    if (!ilo) {
      throw new NotFoundException(
        'Failed to create or retrieve the iLO entity',
      );
    }

    const entity = this.serverDomain.createServerEntityFromDto(dto, ilo.id);
    const server = await this.serverRepository.save(entity);

    const user = await this.userRepository.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    const adminRoleIds =
      user?.roles?.filter((r) => r.isAdmin).map((r) => r.id) ?? [];

    for (const roleId of adminRoleIds) {
      await this.permissionRepository.createPermission(
        server.id,
        roleId,
        PermissionBit.READ |
          PermissionBit.WRITE |
          PermissionBit.DELETE |
          PermissionBit.SHUTDOWN |
          PermissionBit.RESTART,
      );
    }

    await this.logHistory?.executeStructured({
      entity: 'server',
      entityId: server.id,
      action: 'CREATE',
      userId,
      newValue: {
        hostname: server.name,
        description: undefined,
        roomId: server.roomId,
        roomName: room?.name,
        groupId: server.groupId,
        groupName: group?.name,
        upsId: server.upsId,
        iloId: server.iloId,
        iloIpAddress: ilo.ip,
      },
      metadata: {
        serverType: 'physical',
        hasUpsConnection: !!dto.upsId,
        assignedToGroup: !!dto.groupId,
        adminRolesGranted: adminRoleIds.length,
        iloConfigured: true,
        initialPermissions: ['READ', 'WRITE', 'DELETE', 'SHUTDOWN', 'RESTART'],
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    return new ServerResponseDto(server, ilo);
  }
}
