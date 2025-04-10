import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GroupVm } from '../../../groups/domain/entities/group.vm.entity';
import { Server } from '../../../servers/domain/entities/server.entity';
import { PermissionVm } from '../../../permissions/domain/entities/permission.vm.entity';

@Entity('vm')
export class Vm extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  state: string;

  @Column()
  grace_period_on: number;

  @Column()
  grace_period_off: number;

  @Column({ type: 'varchar' })
  os!: string;

  @Column({ type: 'varchar' })
  adminUrl: string;

  @ApiProperty()
  @Column({ type: 'varchar', unique: true })
  ip!: string;

  @Column({ type: 'varchar' })
  login!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ unique: true })
  priority: number;

  @ManyToOne(() => GroupVm, (group) => group.vms)
  @JoinColumn({ name: 'groupId' })
  group: GroupVm;

  @Column()
  groupId!: string;

  @ManyToOne(() => Server, (server) => server.vms)
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @Column()
  serverId!: string;

  @OneToMany(() => PermissionVm, (permission) => permission.vm)
  permissions: PermissionVm[];
}
