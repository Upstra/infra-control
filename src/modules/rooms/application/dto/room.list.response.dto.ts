import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedResponseDto } from '@/core/dto';
import { RoomResponseDto } from './room.response.dto';

export class RoomListResponseDto extends PaginatedResponseDto<RoomResponseDto> {
  @ApiProperty({ type: () => RoomResponseDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomResponseDto)
  readonly items: RoomResponseDto[];

  constructor(
    items: RoomResponseDto[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
  ) {
    super(items, totalItems, currentPage, pageSize);
  }
}
