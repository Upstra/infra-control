import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

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
}
