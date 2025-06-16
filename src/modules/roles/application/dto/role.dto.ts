import { IsArray, IsBoolean, ValidateNested } from 'class-validator';

import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PermissionVmDto } from '@/modules/permissions/application/dto/permission.vm.dto';
import { Type } from 'class-transformer';

export class RoleDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [PermissionVmDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionVmDto)
  permissionVms: PermissionVmDto[];

  @ApiProperty({ type: [PermissionServerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionServerDto)
  permissionServers: PermissionServerDto[];

  @ApiProperty()
  @IsBoolean()
  canCreateServer: boolean;
}
