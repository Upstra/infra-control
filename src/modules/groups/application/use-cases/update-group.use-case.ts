import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { GroupResponseDto } from '../dto/group-response.dto';
import { Group } from '../../domain/entities/group.entity';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class UpdateGroupUseCase {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    dto: UpdateGroupDto,
    userId: string,
  ): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new NotFoundException(`Group with id "${id}" not found`);
    }

    if (dto.name && dto.name !== group.name) {
      const exists = await this.groupRepository.existsByName(dto.name);
      if (exists) {
        throw new ConflictException(
          `Group with name "${dto.name}" already exists`,
        );
      }
    }

    Object.assign(group, dto);
    group.updatedBy = userId;

    const updatedGroup = await this.groupRepository.save(group);

    await this.logHistory.execute('group', updatedGroup.id, 'UPDATE', userId);

    return this.mapToResponseDto(updatedGroup);
  }

  private mapToResponseDto(group: Group): GroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}
