import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic paginated response wrapper.
 *
 * @typeParam T - DTO type for each item
 */
export class PaginatedResponseDto<T> {
  /** Items on the current page */
  @ApiProperty({ isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  readonly items: T[];

  /** Total item count */
  @ApiProperty()
  @IsNumber()
  readonly totalItems: number;

  /** Total number of pages */
  @ApiProperty()
  @IsNumber()
  readonly totalPages: number;

  /** Current page index */
  @ApiProperty()
  @IsNumber()
  readonly currentPage: number;

  constructor(
    items: T[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
  ) {
    this.items = items;
    this.totalItems = totalItems;
    this.currentPage = currentPage;
    this.totalPages = Math.ceil(totalItems / pageSize);
  }
}
