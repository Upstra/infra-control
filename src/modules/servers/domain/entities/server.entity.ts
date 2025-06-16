import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GroupServer } from '../../../groups/domain/entities/group.server.entity';
import { Room } from '../../../rooms/domain/entities/room.entity';
import { Ups } from '../../../ups/domain/entities/ups.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { PermissionServer } from '../../../permissions/domain/entities/permission.server.entity';
import { Ilo } from '../../../ilos/domain/entities/ilo.entity';

@Entity('server')
export class Server extends BaseEntity {
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
  adminUrl: string;

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
  @Column({ type: 'varchar' })
  type: string;

  @ApiProperty()
  @Column({ unique: true })
  priority: number;

  @ApiProperty({ type: () => GroupServer })
  @ManyToOne(() => GroupServer, (group) => group.servers)
  @JoinColumn({ name: 'groupId' })
  group: GroupServer;

  @ApiProperty()
  @Column({ nullable: true })
  groupId!: string;

  @ApiProperty({ type: () => Room, required: false })
  @ManyToOne(() => Room, (room) => room.servers, { nullable: true })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  roomId!: string;

  @ApiProperty({ type: () => Ups, required: false })
  @ManyToOne(() => Ups, (ups) => ups.servers, { nullable: true })
  @JoinColumn({ name: 'upsId' })
  ups?: Ups;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  upsId?: string;

  @ApiProperty({ type: () => Vm, isArray: true })
  @OneToMany(() => Vm, (vm) => vm.server)
  vms: Vm[];

  @OneToMany(() => PermissionServer, (permission) => permission.server)
  permissions: PermissionServer[];

  @ApiProperty({ type: () => Ilo })
  @OneToOne(() => Ilo, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'iloId' })
  ilo?: Ilo;

  @Column({ nullable: true })
  iloId?: string;
}
