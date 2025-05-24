import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { Injectable, Inject } from '@nestjs/common';

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
