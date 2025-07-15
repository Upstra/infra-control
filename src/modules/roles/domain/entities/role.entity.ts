import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';
import { PermissionServer } from '../../../permissions/domain/entities/permission.server.entity';

@Entity('role')
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @OneToMany(() => PermissionServer, (permission) => permission.role, {
    cascade: ['insert'],
  })
  permissionServers: PermissionServer[];

  @Column({ default: false })
  canCreateServer: boolean;

  @Column({ default: false })
  isAdmin: boolean;
}
