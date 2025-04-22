import { PermissionDtoInterface } from '../interfaces/permission.dto.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';
import { PermissionVm } from '../../domain/entities/permission.vm.entity';

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

  constructor(partial?: Partial<PermissionVmDto>) {
    Object.assign(this, partial);
  }
}
