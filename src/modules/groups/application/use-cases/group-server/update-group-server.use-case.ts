import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';
import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';

@Injectable()
export class UpdateGroupServerUseCase {
  constructor(
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerTypeormRepository,
  ) {}

  async execute(id: string, groupDto: GroupServerDto): Promise<GroupServerDto> {
    throw new Error(`Method not implemented: ${id}, ${groupDto}`);
  }
}
