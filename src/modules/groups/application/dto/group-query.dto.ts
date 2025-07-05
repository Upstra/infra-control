import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GroupType } from '../../domain/enums/group-type.enum';

export class GroupQueryDto {
  @ApiProperty({ enum: GroupType, required: false })
  @IsOptional()
  @IsEnum(GroupType)
  type?: GroupType;

  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ required: false, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
