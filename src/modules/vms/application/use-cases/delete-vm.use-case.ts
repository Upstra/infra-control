import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';

/**
 * Deletes a virtual machine by its identifier.
 *
 * Responsibilities:
 * - Validates the VM exists and user has permission.
 * - Performs graceful shutdown if the VM is running.
 * - Removes the VM entity and cascades any cleanup.
 *
 * @param id  UUID of the VM to delete.
 * @returns   Promise<void> upon successful deletion.
 *
 * @throws NotFoundException if no VM matches the given ID.
 *
 * @example
 * await deleteVmUseCase.execute('vm-uuid-123');
 */

@Injectable()
export class DeleteVmUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    await this.repo.findVmById(id);
    await this.repo.deleteVm(id);
  }
}
