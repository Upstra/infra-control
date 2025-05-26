import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { GroupDtoInterface } from '../interfaces/group.dto.interface';
import { GroupServer } from '../../domain/entities/group.server.entity';

export class GroupServerDto implements GroupDtoInterface {
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
  serverIds?: string[];

  constructor(entity: GroupServer) {
    this.name = entity.name;
    this.priority = entity.priority;
    this.serverIds = entity.servers?.map((s) => s.id) ?? [];
  }
}
