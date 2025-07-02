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
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { UpsRepositoryInterface } from '@/modules/ups/domain/interfaces/ups.repository.interface';

@Injectable()
export class CreateServerUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly createIloUsecase: CreateIloUseCase,
    private readonly serverDomain: ServerDomainService,
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerRepositoryInterface,
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
  ): Promise<ServerResponseDto> {
    await this.roomRepository.findRoomById(dto.roomId);

    if (dto.upsId) {
      const ups = await this.upsRepository.findUpsById(dto.upsId);
      if (ups.roomId !== dto.roomId) {
        throw new BadRequestException(
          "L'UPS sélectionné n'appartient pas à la salle spécifiée",
        );
      }
    }

    if (dto.groupId) {
      await this.groupRepository.findOneByField({
        field: 'id',
        value: dto.groupId,
      });
    }

    const ilo = await this.createIloUsecase.execute(dto.ilo);
    if (!ilo) {
      throw new NotFoundException(
        'Failed to create or retrieve the iLO entity',
      );
    }

    const entity = this.serverDomain.createServerEntityFromDto(dto, ilo.id);
    const server = await this.serverRepository.save(entity);
    await this.logHistory?.execute('server', server.id, 'CREATE', userId);

    const user = await this.userRepository.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    if (user?.roleId) {
      await this.permissionRepository.createPermission(
        server.id,
        user.roleId,
        PermissionBit.READ |
          PermissionBit.WRITE |
          PermissionBit.DELETE |
          PermissionBit.SHUTDOWN |
          PermissionBit.RESTART,
      );
    }

    return new ServerResponseDto(server, ilo);
  }
}
