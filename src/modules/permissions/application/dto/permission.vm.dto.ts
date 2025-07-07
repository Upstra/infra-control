import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt } from 'class-validator';
import { PermissionVm } from '../../domain/entities/permission.vm.entity';

export class PermissionVmDto {
  @ApiProperty()
  @IsUUID()
  vmId?: string;

  @ApiProperty()
  @IsUUID()
  roleId?: string;

  @ApiProperty()
  @IsInt()
  bitmask: number;

  constructor(partial?: Partial<PermissionVmDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(saved: PermissionVm): PermissionVmDto {
    return new PermissionVmDto({
      vmId: saved.vmId,
      roleId: saved.roleId,
      bitmask: saved.bitmask,
    });
  }

  static fromEntities(permissions: PermissionVm[]): PermissionVmDto[] {
    return permissions.map((saved) => this.fromEntity(saved));
  }
}

export class UpdatePermissionVmDto {
  @ApiProperty()
  @IsInt()
  bitmask: number;

  constructor(partial?: Partial<UpdatePermissionVmDto>) {
    Object.assign(this, partial);
  }
}
