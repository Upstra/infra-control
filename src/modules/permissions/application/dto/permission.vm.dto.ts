import { PermissionDtoInterface } from '@/modules/permissions/application/interfaces/permission.dto.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';

export class PermissionVmDto implements PermissionDtoInterface {
  @ApiProperty()
  @IsUUID()
  vmId?: string;

  @ApiProperty()
  @IsUUID()
  roleId?: string;

  @ApiProperty()
  @IsBoolean()
  allowWrite?: boolean;

  @ApiProperty()
  @IsBoolean()
  allowRead?: boolean;

  constructor(permission: PermissionVm) {
    this.vmId = permission.vmId;
    this.roleId = permission.roleId;
    this.allowWrite = permission.allowWrite;
    this.allowRead = permission.allowRead;
  }
}
