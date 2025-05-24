import { Injectable, Inject } from '@nestjs/common';
import { GroupServerDto } from '../../dto/group.server.dto';
import { GroupServer } from '@/modules/groups/domain/entities/group.server.entity';
import { GroupServerTypeormRepository } from '@/modules/groups/infrastructure/repositories/group.server.typeorm.repository';

@Injectable()
export class GetAllGroupServerUseCase {
  constructor(
    @Inject('GroupServerRepositoryInterface')
    private readonly groupRepository: GroupServerTypeormRepository,
  ) {}

  async execute(): Promise<GroupServerDto[]> {
    const groups = await this.groupRepository.findAll(['servers']);

    return groups.map(this.entityToDto);
  }

  private entityToDto(entity: GroupServer): GroupServerDto {
    return {
      name: entity.name,
      priority: entity.priority,
      serverIds: entity.servers?.map((s) => s.id) ?? [],
    };
  }
}
