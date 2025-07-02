import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';

import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { GroupServerDomainService } from '@/modules/groups/domain/services/group.server.domain.service';

/**
 * Updates an existing server group’s metadata and membership.
 *
 * Steps:
 * 1. Fetch the existing group or throw GroupNotFoundException.
 * 2. Optionally reload servers if serverIds provided.
 * 3. Apply DTO fields to the entity via the domain service.
 * 4. Persist and return the updated group DTO.
 *
 * @param id        The UUID of the group to update.
 * @param groupDto  DTO containing new name, priority, and optional serverIds.
 * @returns {Promise<GroupServerDto>}
 *   The updated group DTO with refreshed server associations.
 *
 * @throws {GroupNotFoundException} if the group does not exist.
 *
 * @example
 * const updated = await updateGroupServerUseCase.execute(groupId, { name: 'Rack B' });
 */

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
