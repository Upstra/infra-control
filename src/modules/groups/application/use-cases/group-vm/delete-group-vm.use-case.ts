import { Injectable, Inject } from '@nestjs/common';
import { GroupRepositoryInterface } from '../../../domain/interfaces/group.repository.interface';

@Injectable()
export class DeleteGroupVmUseCase {
  constructor(
    @Inject('GroupRepositoryInterface')
    private readonly groupRepository: GroupRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    return this.groupRepository.deleteGroup(id);
  }
}
