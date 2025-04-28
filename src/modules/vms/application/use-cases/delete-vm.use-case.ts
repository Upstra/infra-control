import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import {
  VmNotFoundException,
  VmDeletionException,
} from '../../domain/exceptions/vm.exception';

@Injectable()
export class DeleteVmUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const vm = await this.repo.findVmById(id);
      if (!vm) throw new VmNotFoundException(id);

      await this.repo.deleteVm(id);
    } catch (error) {
      if (error instanceof VmNotFoundException) {
        throw error;
      }
      throw new VmDeletionException();
    }
  }
}
