import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UserUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly username?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly password?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly email?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  readonly roleId?: string;
}
