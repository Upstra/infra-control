import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { IsValidName } from '../../../../core/decorators/is-valid-name.decorator';

export class UserUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(3, 10)
  readonly username?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(2, 15)
  @IsValidName()
  readonly firstName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(2, 15)
  @IsValidName()
  readonly lastName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly email?: string;
}
