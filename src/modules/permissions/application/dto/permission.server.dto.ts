import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';
import { PermissionDtoInterface } from '../interfaces/permission.dto.interface';

export class PermissionServerDto implements PermissionDtoInterface {
  @ApiProperty()
  @IsUUID()
  roleId?: string;

  @ApiProperty()
  @IsUUID()
  serverId?: string;

  @ApiProperty()
  @IsBoolean()
  allowWrite: boolean;

  @ApiProperty()
  @IsBoolean()
  allowRead: boolean;

  constructor(partial?: Partial<PermissionServerDto>) {
    Object.assign(this, partial);
  }
}
