import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';
import { Injectable, Inject } from '@nestjs/common';

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
