import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';
import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';

@Injectable()
export class GetAllGroupServerUseCase {
  constructor(
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerTypeormRepository,
  ) {}

  async execute(): Promise<GroupServerDto[]> {
    const groups = await this.groupRepository.findAll(['servers']);

    return groups.map((group) => new GroupServerDto(group));
  }
}
