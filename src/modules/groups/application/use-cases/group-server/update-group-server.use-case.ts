import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';

import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { GroupServerDomainService } from '@/modules/groups/domain/services/group.server.domain.service';

@Injectable()
export class UpdateGroupServerUseCase {
  constructor(
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerRepositoryInterface,

    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,

    private readonly domain: GroupServerDomainService,
  ) {}

  async execute(id: string, groupDto: GroupServerDto): Promise<GroupServerDto> {
    const existing = await this.groupRepository.findGroupById(id);
    if (!existing) throw new GroupNotFoundException('server', id);

    let servers = existing.servers;
    if (groupDto.serverIds) {
      //TODO: create a use case for this
      servers = await this.serverRepository.findAllByField({
        field: 'id',
        value: groupDto.serverIds,
        relations: ['group'],
      });
    }

    const entity = this.domain.updateGroupEntityFromDto(existing, groupDto);
    entity.servers = servers;

    const updated = await this.groupRepository.save(entity);
    return new GroupServerDto(updated);
  }
}
