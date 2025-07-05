import { Injectable, ConflictException } from '@nestjs/common';
import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import { Group } from '../../domain/entities/group.entity';
import { CreateGroupDto } from '../dto/create-group.dto';
import { GroupResponseDto } from '../dto/group-response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { GroupMapper } from '../mappers/group.mapper';

@Injectable()
export class CreateGroupUseCase {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  async execute(
    dto: CreateGroupDto,
    userId: string,
  ): Promise<GroupResponseDto> {
    const exists = await this.groupRepository.existsByName(dto.name);
    if (exists) {
      throw new ConflictException(
        `Group with name "${dto.name}" already exists`,
      );
    }

    const group = new Group();
    group.name = dto.name;
    group.description = dto.description;
    group.type = dto.type;
    group.createdBy = userId;
    group.updatedBy = userId;

    const savedGroup = await this.groupRepository.save(group);

    await this.logHistory.execute('group', savedGroup.id, 'CREATE', userId);

    return GroupMapper.toResponseDto(savedGroup);
  }
}
