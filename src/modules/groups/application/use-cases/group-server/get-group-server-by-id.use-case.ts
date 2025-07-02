import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';

/**
 * Retrieves a single server group by its identifier, including its servers.
 *
 * @param id  The UUID of the server group to fetch.
 * @returns {Promise<GroupServerDto>}
 *   A DTO representing the group and its server list.
 *
 * @throws {NotFoundException} if no group with the given id exists.
 *
 * @remarks
 * Relies on a generic field-based lookup to allow flexible queries;
 * controllers should surface 404 errors if the group is missing.
 *
 * @example
 * const group = await getGroupServerByIdUseCase.execute('123e4567-e89b-12d3-a456-426614174000');
 */

@Injectable()
export class GetGroupServerByIdUseCase {
  constructor(
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerRepositoryInterface,
  ) {}

  async execute(id: string): Promise<GroupServerDto> {
    const group = await this.groupRepository.findOneByField({
      field: 'id',
      value: id,
      relations: ['servers'],
    });

    return GroupServerDto.fromEntity(group);
  }
}
