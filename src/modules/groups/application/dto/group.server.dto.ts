import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { GroupDtoInterface } from '../interfaces/group.dto.interface';
import { GroupServer } from '../../domain/entities/group.server.entity';
import { IsPriority } from '../validators/priority.validator';

export class GroupServerDto implements GroupDtoInterface {
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
  cascade?: boolean = true;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  roomId?: string;

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
      description: entity.description,
      cascade: entity.cascade,
      roomId: entity.roomId,
      serverIds: entity.servers?.map((s) => s.id) ?? [],
    });
  }
}
