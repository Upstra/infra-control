import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';
import { PermissionDtoInterface } from '../interfaces/permission.dto.interface';
import { PermissionServer } from '../../domain/entities/permission.server.entity';

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

  static fromEntity(saved: PermissionServer): PermissionServerDto {
    return new PermissionServerDto({
      roleId: saved.roleId,
      serverId: saved.serverId,
      allowWrite: saved.allowWrite,
      allowRead: saved.allowRead,
    });
  }
}
