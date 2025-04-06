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
import { Group } from '../../../groups/domain/entities/group.entity';
import { Server } from '../../../servers/domain/entities/server.entity';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';

@Entity('vm')
export class Vm extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

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

  @ApiProperty({ type: () => Group })
  @ManyToOne(() => Group, (group) => group.servers)
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @ApiProperty()
  @Column()
  groupId!: number;

  @ApiProperty({ type: () => Server })
  @ManyToOne(() => Server, (server) => server.vms)
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ApiProperty()
  @Column()
  serverId!: number;

  @ApiProperty({ type: () => PermissionVm, isArray: true })
  @ManyToMany(() => PermissionVm, (permission) => permission.vms)
  @JoinColumn()
  permissions: PermissionVm[];
}
