import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidName } from '../../../../core/decorators/is-valid-name.decorator';

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: 'User first name' })
  @IsOptional()
  @IsString()
  @Length(2, 15)
  @IsValidName()
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  @Length(2, 15)
  @IsValidName()
  lastName?: string;

  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'User active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'User verified status' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
