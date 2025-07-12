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
import { Group } from '../../../groups/domain/entities/group.entity';
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
  @Column({ type: 'varchar', nullable: true })
  moid?: string;

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
  @Column({ type: 'varchar', nullable: true })
  os?: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  guestOs?: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  guestFamily?: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  version?: string;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  createDate?: Date;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  numCoresPerSocket?: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  numCPU?: number;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  esxiHostName?: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  esxiHostMoid?: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  adminUrl?: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  ip?: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  login?: string;

  @ApiProperty({ writeOnly: true })
  @Column({ type: 'varchar', nullable: true, select: false })
  password?: string;

  @ApiProperty()
  @Column()
  priority: number;

  @ApiProperty({ type: () => Group })
  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group?: Group;

  @ApiProperty()
  @Column({ nullable: true, name: 'group_id' })
  groupId?: string;

  @ApiProperty({ type: () => Server })
  @ManyToOne(() => Server, (server) => server.vms)
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ApiProperty()
  @Column()
  serverId!: string;

  @ApiProperty({ type: () => PermissionVm, isArray: true })
  @OneToMany(() => PermissionVm, (permission) => permission.vm)
  permissions: PermissionVm[];
}
