import { Group } from '../../domain/entities/group.entity';
import { GroupResponseDto } from '../dto/group-response.dto';
import { GroupWithCounts } from '../../domain/interfaces/group.repository.interface';
import { GroupType } from '../../domain/enums/group-type.enum';

export class GroupMapper {
  static toResponseDto(group: Group): GroupResponseDto {
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

  static toResponseDtoWithCounts(group: GroupWithCounts): GroupResponseDto {
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
