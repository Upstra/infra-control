import { IsArray, IsBoolean, ValidateNested } from 'class-validator';

import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RoleDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [PermissionServerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionServerDto)
  permissionServers: PermissionServerDto[];

  @ApiProperty()
  @IsBoolean()
  canCreateServer: boolean;

  @ApiProperty()
  @IsBoolean()
  isAdmin: boolean;
}
