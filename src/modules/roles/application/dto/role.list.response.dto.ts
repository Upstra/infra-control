import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleResponseDto } from './role.response.dto';
import { PaginatedResponseDto } from '@/core/dto';

/**
 * Response wrapper for a paginated list of roles.
 */
export class RoleListResponseDto extends PaginatedResponseDto<RoleResponseDto> {
  @ApiProperty({ type: () => RoleResponseDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleResponseDto)
  readonly items: RoleResponseDto[];

  constructor(
    items: RoleResponseDto[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
  ) {
    super(items, totalItems, currentPage, pageSize);
  }
}
