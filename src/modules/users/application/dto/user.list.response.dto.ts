import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserResponseDto } from './user.response.dto';
import { PaginatedResponseDto } from '@/core/dto';

export class UserListResponseDto extends PaginatedResponseDto<UserResponseDto> {
  @ApiProperty({ type: () => UserResponseDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserResponseDto)
  readonly items: UserResponseDto[];

  constructor(
    items: UserResponseDto[],
    totalItems: number,
    currentPage: number,
    pageSize: number,
  ) {
    super(items, totalItems, currentPage, pageSize);
  }
}
