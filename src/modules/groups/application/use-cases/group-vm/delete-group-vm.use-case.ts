import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { Injectable, Inject } from '@nestjs/common';

/**
 * Deletes a virtual machine group by its identifier.
 *
 * @param id  The UUID of the VM group to delete.
 * @returns {Promise<void>}
 *
 * @remarks
 * Ensures removal via repository; calling code should handle cascading
 * or orphan cleanup if needed.
 *
 * @example
 * await deleteGroupVmUseCase.execute('...uuid...');
 */

@Injectable()
export class DeleteGroupVmUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    return this.groupRepository.deleteGroup(id);
  }
}
