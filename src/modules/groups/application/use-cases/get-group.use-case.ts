import { Injectable, NotFoundException } from '@nestjs/common';
import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import { GroupResponseDto } from '../dto/group-response.dto';
import { GroupWithCounts } from '../../domain/interfaces/group.repository.interface';
import { GroupType } from '../../domain/enums/group-type.enum';

@Injectable()
export class GetGroupUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(id: string): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findByIdWithCounts(id);
    if (!group) {
      throw new NotFoundException(`Group with id "${id}" not found`);
    }

    return this.mapToResponseDto(group);
  }

  private mapToResponseDto(group: GroupWithCounts): GroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      serverCount:
        group.type === GroupType.SERVER ? group.serverCount : undefined,
      vmCount: group.type === GroupType.VM ? group.vmCount : undefined,
    };
  }
}
