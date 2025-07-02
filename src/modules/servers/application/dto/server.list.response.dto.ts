import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedResponseDto } from '@/core/dto';
import { ServerResponseDto } from './server.response.dto';

export class ServerListResponseDto extends PaginatedResponseDto<ServerResponseDto> {
  @ApiProperty({ type: () => ServerResponseDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServerResponseDto)
  readonly items: ServerResponseDto[];

  constructor(
    items: ServerResponseDto[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
  ) {
    super(items, totalItems, currentPage, pageSize);
  }
}
