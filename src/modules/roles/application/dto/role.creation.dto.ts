import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoleCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;
}

export class AdminRoleCreationDto extends RoleCreationDto {
  @IsBoolean() isAdmin = false;
  @IsBoolean() canCreateServer = false;
}
