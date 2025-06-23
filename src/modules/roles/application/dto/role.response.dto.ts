import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Role } from '../../domain/entities/role.entity';
import { PermissionVmDto } from '../../../permissions/application/dto/permission.vm.dto';
import { PermissionServerDto } from '../../../permissions/application/dto/permission.server.dto';

export class RoleResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly id!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty({ type: () => PermissionServerDto, isArray: true })
  readonly permissionServers: PermissionServerDto[];

  @ApiProperty({ type: () => PermissionVmDto, isArray: true })
  readonly permissionVms: PermissionVmDto[];

  constructor(role: Role) {
    this.id = role.id;
    this.name = role.name;
    this.permissionServers = (role.permissionServers ?? []).map(
      (permission) => new PermissionServerDto(permission),
    );
    this.permissionVms = (role.permissionVms ?? []).map(
      (permission) => new PermissionVmDto(permission),
    );
  }
}
