import { Entity, JoinColumn, ManyToOne, Column } from 'typeorm';
import { Permission } from './permission.entity';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Role } from '../../../roles/domain/entities/role.entity';

@Entity('permission_server')
export class PermissionServer extends Permission {
  @ManyToOne(() => Role, (role) => role.permissionServers, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Server, (server) => server.permissions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serverId' })
  server?: Server | null;

  @Column({ type: 'uuid', nullable: true })
  serverId?: string | null;
}
