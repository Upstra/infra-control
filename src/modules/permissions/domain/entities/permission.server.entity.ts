import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Permission } from './permission.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';

@Entity('permission_server')
export class PermissionServer extends Permission {
  @ManyToOne(() => Role, (role) => role.permissionServers)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Server, (server) => server.permissions)
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @PrimaryColumn()
  serverId!: string;
}
