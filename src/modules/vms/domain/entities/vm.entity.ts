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
  @ApiProperty()
  @Column({ type: 'varchar', unique: true })
  ip!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  login!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  password!: string;

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
