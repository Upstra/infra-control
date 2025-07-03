import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedResponseDto } from '@/core/dto';
import { ShutdownStep } from './shutdown-preview.response.dto';

export class ShutdownPreviewListResponseDto extends PaginatedResponseDto<ShutdownStep> {
  @ApiProperty({ type: () => ShutdownStep, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShutdownStep)
  readonly items: ShutdownStep[];

  @ApiProperty()
  readonly totalVms: number;

  @ApiProperty()
  readonly totalServers: number;

  constructor(
    items: ShutdownStep[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
    totalVms: number,
    totalServers: number,
  ) {
    super(items, totalItems, currentPage, pageSize);
    this.totalVms = totalVms;
    this.totalServers = totalServers;
  }
}