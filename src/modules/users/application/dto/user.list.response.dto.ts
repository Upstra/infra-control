import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserResponseDto } from './user.response.dto';

export class UserListResponseDto {
  @ApiProperty({ type: () => UserResponseDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserResponseDto)
  readonly items: UserResponseDto[];

  @ApiProperty()
  @IsNumber()
  readonly totalItems: number;

  @ApiProperty()
  @IsNumber()
  readonly totalPages: number;

  @ApiProperty()
  @IsNumber()
  readonly currentPage: number;

  constructor(
    items: UserResponseDto[],
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
