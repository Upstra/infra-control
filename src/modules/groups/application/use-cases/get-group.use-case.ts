import { Injectable, NotFoundException } from '@nestjs/common';
import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import { GroupResponseDto } from '../dto/group-response.dto';
import { GroupMapper } from '../mappers/group.mapper';

@Injectable()
export class GetGroupUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(id: string): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findByIdWithCounts(id);
    if (!group) {
      throw new NotFoundException(`Group with id "${id}" not found`);
    }

    return GroupMapper.toResponseDtoWithCounts(group);
  }
}
