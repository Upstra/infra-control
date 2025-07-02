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
import { PermissionVm } from '../../../permissions/domain/entities/permission.vm.entity';

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

  @OneToMany(() => PermissionVm, (permission) => permission.role, {
    cascade: ['insert'],
  })
  permissionVms: PermissionVm[];

  @Column({ default: false })
  canCreateServer: boolean;

  @Column({ default: false })
  isAdmin: boolean;
}
