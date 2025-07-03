import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { GroupDtoInterface } from '../interfaces/group.dto.interface';
import { GroupVm } from '../../domain/entities/group.vm.entity';
import { IsPriority } from '../validators/priority.validator';

export class GroupVmDto implements GroupDtoInterface {
  @ApiProperty()
  @IsString()
  name?: string;

  @ApiProperty({ minimum: 1, maximum: 4 })
  @IsPriority()
  priority?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  cascade?: boolean;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  serverGroupId?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  vmIds?: string[];

  constructor(partial?: Partial<GroupVmDto> | GroupVm) {
    if (partial instanceof GroupVm) {
      Object.assign(this, GroupVmDto.fromEntity(partial));
    } else {
      Object.assign(this, { vmIds: [], ...partial });
    }
  }

  static fromEntity(entity: GroupVm): GroupVmDto {
    return {
      name: entity.name,
      priority: entity.priority,
      description: entity.description,
      cascade: entity.cascade,
      roomId: entity.roomId,
      serverGroupId: entity.serverGroupId,
      vmIds: entity.vms ? entity.vms.map((v) => v.id) : [],
    };
  }
}
