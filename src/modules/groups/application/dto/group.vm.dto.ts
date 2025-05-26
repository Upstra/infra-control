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

  constructor(entity: GroupVm) {
    this.name = entity.name;
    this.priority = entity.priority;
    this.vmIds = entity.vms?.map((vm) => vm.id) ?? [];
  }
}
