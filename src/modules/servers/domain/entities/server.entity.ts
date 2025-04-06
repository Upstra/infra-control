import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Group } from '../../../groups/domain/entities/group.entity';
import { Room } from '../../../rooms/domain/entities/room.entity';
import { Ups } from '../../../ups/domain/entities/ups.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';

@Entity('serveur')
export class Server extends BaseEntity {
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
  ip!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  login!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  password!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  type: string;

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

  @ApiProperty({ type: () => Room })
  @ManyToOne(() => Room, (room) => room.servers)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ApiProperty()
  @Column()
  roomId!: number;

  @ApiProperty({ type: () => Ups })
  @ManyToOne(() => Ups, (ups) => ups.servers)
  @JoinColumn({ name: 'upsId' })
  ups: Ups;

  @ApiProperty()
  @Column()
  upsId!: number;

  @ApiProperty({ type: () => Vm, isArray: true })
  @OneToMany(() => Vm, (vm) => vm.server)
  vms: Vm[];

  @ApiProperty({ type: () => PermissionServer, isArray: true })
  @ManyToMany(() => PermissionServer, (permission) => permission.servers)
  @JoinColumn()
  permissions: PermissionServer[];
}
