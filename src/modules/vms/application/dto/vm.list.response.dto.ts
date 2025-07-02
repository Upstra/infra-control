import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedResponseDto } from '@/core/dto';
import { VmResponseDto } from './vm.response.dto';

export class VmListResponseDto extends PaginatedResponseDto<VmResponseDto> {
  @ApiProperty({ type: () => VmResponseDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VmResponseDto)
  readonly items: VmResponseDto[];

  constructor(
    items: VmResponseDto[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
  ) {
    super(items, totalItems, currentPage, pageSize);
  }
}
