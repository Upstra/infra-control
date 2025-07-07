import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, IsOptional } from 'class-validator';
import { PermissionServer } from '../../domain/entities/permission.server.entity';

export class PermissionServerDto {
  @ApiProperty()
  @IsUUID()
  roleId?: string;

  @ApiProperty()
  @IsUUID()
  serverId?: string;

  @ApiProperty()
  @IsInt()
  bitmask: number;

  constructor(partial?: Partial<PermissionServerDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(saved: PermissionServer): PermissionServerDto {
    return new PermissionServerDto({
      roleId: saved.roleId,
      serverId: saved.serverId,
      bitmask: saved.bitmask,
    });
  }

  static fromEntities(permissions: PermissionServer[]): PermissionServerDto[] {
    return permissions.map((saved) => this.fromEntity(saved));
  }
}

export class UpdatePermissionServerDto {
  @ApiProperty()
  @IsInt()
  bitmask: number;

  constructor(partial?: Partial<UpdatePermissionServerDto>) {
    Object.assign(this, partial);
  }
}
