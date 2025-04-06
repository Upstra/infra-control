import { Entity, JoinColumn, ManyToMany, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@/modules/roles/domain/entities/role.entity';

@Entity('permission_server')
export class PermissionServer extends Permission {
  @ApiProperty({ type: () => Server, isArray: true })
  @ManyToMany(() => Server, (server) => server.permissions)
  @JoinColumn()
  servers: Server[];

  @ApiProperty({ type: () => Role, isArray: true })
  @OneToMany(() => Role, (role) => role.permissionServer)
  roles: Role[];
}
