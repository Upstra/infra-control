import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedResponseDto } from '@/core/dto';
import { GroupServerResponseDto } from './group.server.response.dto';

export class GroupServerListResponseDto extends PaginatedResponseDto<GroupServerResponseDto> {
  @ApiProperty({ type: () => GroupServerResponseDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupServerResponseDto)
  readonly items: GroupServerResponseDto[];

  constructor(
    items: GroupServerResponseDto[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
  ) {
    super(items, totalItems, currentPage, pageSize);
  }
}