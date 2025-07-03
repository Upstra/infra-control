import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';
import { GroupServerResponseDto } from '../../dto/group.server.response.dto';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { GroupServerDomainService } from '@/modules/groups/domain/services/group.server.domain.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

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
 * @returns {Promise<GroupServerResponseDto>}
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
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    groupDto: GroupServerDto,
    userId?: string,
  ): Promise<GroupServerResponseDto> {
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

    const oldValue = {
      name: existing.name,
      priority: existing.priority,
      description: existing.description,
      cascade: existing.cascade,
      roomId: existing.roomId,
    };

    const entity = this.domain.updateGroupEntityFromDto(existing, groupDto);
    entity.servers = servers;
    entity.description = groupDto.description;
    entity.cascade = groupDto.cascade ?? existing.cascade;
    entity.roomId = groupDto.roomId;

    const updated = await this.groupRepository.save(entity);

    await this.logHistory?.executeStructured({
      entity: 'group_server',
      entityId: id,
      action: 'UPDATE',
      userId,
      oldValue,
      newValue: {
        name: updated.name,
        priority: updated.priority,
        description: updated.description,
        cascade: updated.cascade,
        roomId: updated.roomId,
      },
    });

    const savedGroup = await this.groupRepository.findOneByField({
      field: 'id',
      value: updated.id,
      relations: ['servers', 'vmGroups'],
    });

    return new GroupServerResponseDto(savedGroup);
  }
}
