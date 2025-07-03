import { Injectable, Inject } from '@nestjs/common';
import { GroupServerResponseDto } from '../../dto/group.server.response.dto';
import { GroupServerListResponseDto } from '../../dto/group.server.list.response.dto';
import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';

/**
 * Retrieves all server groups with their associated servers.
 *
 * Delegates to the repository to load groups with eager-loaded server relations,
 * then maps each group entity to its DTO representation.
 *
 * @returns {Promise<GroupServerListResponseDto>}
 *   A paginated response containing GroupServerResponseDto items and pagination metadata.
 *
 * @remarks
 * This use-case is read-only and applies no additional business rules beyond
 * mapping entities to DTOs.
 *
 * @example
 * const groups = await getAllGroupServerUseCase.execute();
 */

@Injectable()
export class GetAllGroupServerUseCase {
  constructor(
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerTypeormRepository,
  ) {}

  async execute(
    roomId?: string,
    priority?: number,
    page = 1,
    limit = 10,
  ): Promise<GroupServerListResponseDto> {
    const [groups, total] = await this.groupRepository.findAllPaginated(
      ['servers', 'vmGroups'],
      {
        roomId,
        priority,
      },
      page,
      limit,
    );
    const items = groups.map((group) => new GroupServerResponseDto(group));
    return new GroupServerListResponseDto(items, total, page, limit);
  }
}
