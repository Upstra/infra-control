import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';
import { GroupServerDomainService } from '@/modules/groups/domain/services/group.server.domain.service';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';

/**
 * Creates a new server group and optionally associates servers.
 *
 * Orchestrates:
 * 1. Domain entity creation from DTO via GroupServerDomainService.
 * 2. Loading and validation of each referenced server.
 * 3. Persistence of the new group with assigned servers.
 *
 * @param groupDto  DTO containing group name, priority, and optional serverIds.
 * @returns {Promise<GroupServerDto>}
 *   The persisted group DTO reflecting any assigned servers.
 *
 * @throws {Error} if any serverId does not correspond to an existing server.
 *
 * @example
 * const newGroup = await createGroupServerUseCase.execute({ name: 'Rack A', priority: 1, serverIds: ['id1','id2'] });
 */

@Injectable()
export class CreateGroupServerUseCase {
  constructor(
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerTypeormRepository,

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
