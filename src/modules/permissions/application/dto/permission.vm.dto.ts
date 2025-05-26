import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PermissionVm } from '../../domain/entities/permission.vm.entity';

export class PermissionVmDto {
  @ApiProperty()
  @IsUUID()
  @IsOptional()
  vmId?: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  allowWrite?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  allowRead?: boolean;

  constructor(partial?: Partial<PermissionVmDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(saved: PermissionVm): PermissionVmDto {
    return new PermissionVmDto({
      vmId: saved.vmId,
      roleId: saved.roleId,
      allowWrite: saved.allowWrite,
      allowRead: saved.allowRead,
    });
  }
}
