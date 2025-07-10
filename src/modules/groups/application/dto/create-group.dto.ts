import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupType } from '../../domain/enums/group-type.enum';

export class CreateGroupDto {
  @ApiProperty({ description: 'Group name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Group description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: GroupType,
    description: 'Type of resources in this group',
  })
  @IsNotEmpty()
  @IsEnum(GroupType)
  type: GroupType;
}
