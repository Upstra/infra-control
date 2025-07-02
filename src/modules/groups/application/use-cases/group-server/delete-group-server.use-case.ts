import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';
import { Injectable, Inject } from '@nestjs/common';

/**
 * Deletes a server group by its identifier.
 *
 * @param id  The UUID of the group to remove.
 * @returns {Promise<void>}
 *
 * @remarks
 * Delegates deletion to the repository; use-cases should ensure
 * no orphaned references remain if other entities depend on this group.
 *
 * @example
 * await deleteGroupServerUseCase.execute('123e4567-e89b-12d3-a456-426614174000');
 */

@Injectable()
export class DeleteGroupServerUseCase {
  constructor(
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerTypeormRepository,
  ) {}

  async execute(id: string): Promise<void> {
    await this.groupRepository.deleteGroup(id);
  }
}
