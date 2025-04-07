import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GroupVm } from '../../../groups/domain/entities/group.vm.entity';
import { Server } from '../../../servers/domain/entities/server.entity';
import { PermissionVm } from '../../../permissions/domain/entities/permission.vm.entity';

@Entity('vm')
export class Vm extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  name!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  state: string;

  @ApiProperty()
  @Column()
  grace_period_on: number;

  @ApiProperty()
  @Column()
  grace_period_off: number;

  @ApiProperty()
  @Column({ type: 'varchar' })
  os!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  adminUrl: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  ip!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  login!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  password!: string;

  @ApiProperty()
  @Column({ unique: true })
  priority: number;

  @ApiProperty({ type: () => GroupVm })
  @ManyToOne(() => GroupVm, (group) => group.vms)
  @JoinColumn({ name: 'groupId' })
  group: GroupVm;

  @ApiProperty()
  @Column()
  groupId!: string;

  @ApiProperty({ type: () => Server })
  @ManyToOne(() => Server, (server) => server.vms)
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ApiProperty()
  @Column()
  serverId!: string;

  @ApiProperty({ type: () => PermissionVm, isArray: true })
  @ManyToMany(() => PermissionVm, (permission) => permission.vms)
  @JoinColumn()
  permissions: PermissionVm[];
}
