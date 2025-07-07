import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleDto } from '@/modules/roles/application/dto/role.dto';

export class AuthenticatedUserDto {
  @ApiProperty()
  @IsBoolean()
  isTwoFactorEnabled: boolean;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ type: RoleDto })
  @ValidateNested()
  @Type(() => RoleDto)
  role: RoleDto;

  @ApiProperty()
  @IsBoolean()
  active: boolean;
}
