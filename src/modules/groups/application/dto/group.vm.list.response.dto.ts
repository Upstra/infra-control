import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedResponseDto } from '@/core/dto';
import { GroupVmResponseDto } from './group.vm.response.dto';

export class GroupVmListResponseDto extends PaginatedResponseDto<GroupVmResponseDto> {
  @ApiProperty({ type: () => GroupVmResponseDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupVmResponseDto)
  readonly items: GroupVmResponseDto[];

  constructor(
    items: GroupVmResponseDto[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
  ) {
    super(items, totalItems, currentPage, pageSize);
  }
}
