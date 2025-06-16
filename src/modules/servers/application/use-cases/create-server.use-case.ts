import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';

import { ServerDomainService } from '@/modules/servers/domain/services/server.domain.service';
import { CreateIloUseCase } from '@/modules/ilos/application/use-cases';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerResponseDto } from '../dto/server.response.dto';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';

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
  ) {}

  async execute(dto: ServerCreationDto): Promise<ServerResponseDto> {
    await this.roomRepository.findRoomById(dto.roomId);

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

    return new ServerResponseDto(server, ilo);
  }
}
