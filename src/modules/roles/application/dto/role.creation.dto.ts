import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

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
