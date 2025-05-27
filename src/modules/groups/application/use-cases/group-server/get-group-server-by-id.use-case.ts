import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';
import { GroupServerRepositoryInterface } from '@/modules/groups/domain/interfaces/group-server.repository.interface';

@Injectable()
export class GetGroupServerByIdUseCase {
  constructor(
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerRepositoryInterface,
  ) {}

  async execute(id: string): Promise<GroupServerDto> {
    const group = await this.groupRepository.findOneByField({
      field: 'id',
      value: id,
      relations: ['servers'],
    });

    return GroupServerDto.fromEntity(group);
  }
}
