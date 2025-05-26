import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { GroupDtoInterface } from '../interfaces/group.dto.interface';
import { GroupVm } from '../../domain/entities/group.vm.entity';

export class GroupVmDto implements GroupDtoInterface {
  @ApiProperty()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsNumber()
  priority?: number;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  vmIds?: string[];

  constructor(partial?: Partial<GroupVmDto>) {
    Object.assign(this, { vmIds: [], ...partial });
  }

  static fromEntity(entity: GroupVm): GroupVmDto {
    return new GroupVmDto({
      name: entity.name,
      priority: entity.priority,
      vmIds: entity.vms ? entity.vms.map((v) => v.id) : [],
    });
  }
}
