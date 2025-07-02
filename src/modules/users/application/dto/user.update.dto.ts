import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UserUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(3, 10)
  readonly username?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(3, 10)
  readonly firstName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(3, 10)
  readonly lastName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly email?: string;
}
