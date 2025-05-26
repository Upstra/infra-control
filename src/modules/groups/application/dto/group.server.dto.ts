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

  constructor(partial?: Partial<GroupServerDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: GroupServer): GroupServerDto {
    return new GroupServerDto({
      name: entity.name,
      priority: entity.priority,
      serverIds: entity.servers?.map((s) => s.id) ?? [],
    });
  }
}
