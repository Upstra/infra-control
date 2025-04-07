import { PermissionDtoInterface } from '@/modules/permissions/application/interfaces/permission.dto.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';

export class PermissionServerDto implements PermissionDtoInterface {
  @ApiProperty()
  @IsUUID()
  roleId?: string;

  @ApiProperty()
  @IsUUID()
  serverId?: string;

  @ApiProperty()
  @IsBoolean()
  allowWrite?: boolean;

  @ApiProperty()
  @IsBoolean()
  allowRead?: boolean;

  constructor(permission: PermissionServer) {
    this.serverId = permission.serverId;
    this.roleId = permission.roleId;
    this.allowWrite = permission.allowWrite;
    this.allowRead = permission.allowRead;
  }
}
