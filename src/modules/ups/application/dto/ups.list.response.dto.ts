import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedResponseDto } from '@/core/dto';
import { UpsResponseDto } from './ups.response.dto';

export class UpsListResponseDto extends PaginatedResponseDto<UpsResponseDto> {
  @ApiProperty({ type: () => UpsResponseDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsResponseDto)
  readonly items: UpsResponseDto[];

  constructor(
    items: UpsResponseDto[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
  ) {
    super(items, totalItems, currentPage, pageSize);
  }
}
