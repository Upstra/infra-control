import { Injectable, Inject } from '@nestjs/common';
import { GroupServerResponseDto } from '../../dto/group.server.response.dto';
import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';

/**
 * Retrieves all server groups with their associated servers.
 *
 * Delegates to the repository to load groups with eager-loaded server relations,
 * then maps each group entity to its DTO representation.
 *
 * @returns {Promise<GroupServerResponseDto[]>}
 *   An array of GroupServerResponseDto, each containing group metadata and its servers.
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
  ): Promise<GroupServerResponseDto[]> {
    const groups = await this.groupRepository.findAll(['servers', 'vmGroups'], {
      roomId,
      priority,
    });
    return groups.map((group) => new GroupServerResponseDto(group));
  }
}
