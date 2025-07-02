import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';
import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';

/**
 * Retrieves all server groups with their associated servers.
 *
 * Delegates to the repository to load groups with eager-loaded server relations,
 * then maps each group entity to its DTO representation.
 *
 * @returns {Promise<GroupServerDto[]>}
 *   An array of GroupServerDto, each containing group metadata and its servers.
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

  async execute(): Promise<GroupServerDto[]> {
    const groups = await this.groupRepository.findAll(['servers']);
    return groups.map((group) => GroupServerDto.fromEntity(group));
  }
}
