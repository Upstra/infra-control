import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../../../domain/interfaces/group.repository.interface';
import { GroupServerDto } from '../../dto/group.server.dto';
import { GroupServerDomainService } from '@/modules/groups/domain/services/group.server.domain.service';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';

@Injectable()
export class CreateGroupServerUseCase {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,

    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,

    private readonly domain: GroupServerDomainService,
  ) {}

  async execute(groupDto: GroupServerDto): Promise<GroupServerDto> {
    const entity = this.domain.createGroup(groupDto);

    if (groupDto.serverIds?.length) {
      entity.servers = await Promise.all(
        groupDto.serverIds.map(async (serverId) => {
          const server = await this.serverRepository.findOneByField({
            field: 'id',
            value: serverId,
          });
          if (!server) {
            throw new Error(`Server not found: ${serverId}`);
          }
          return server;
        }),
      );
    } else {
      entity.servers = [];
    }

    const group = await this.groupRepository.save(entity);
    return group;
  }
}
