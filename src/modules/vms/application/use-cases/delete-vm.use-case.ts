import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';

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
