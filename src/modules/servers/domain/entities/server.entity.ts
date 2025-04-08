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
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';

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
  @Column()
  groupId!: string;

  @ApiProperty({ type: () => Room })
  @ManyToOne(() => Room, (room) => room.servers)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ApiProperty()
  @Column()
  roomId!: string;

  @ApiProperty({ type: () => Ups })
  @ManyToOne(() => Ups, (ups) => ups.servers)
  @JoinColumn({ name: 'upsId' })
  ups: Ups;

  @ApiProperty()
  @Column()
  upsId: string;

  @ApiProperty({ type: () => Vm, isArray: true })
  @OneToMany(() => Vm, (vm) => vm.server)
  vms: Vm[];

  @OneToMany(() => PermissionServer, (permission) => permission.server)
  permissions: PermissionServer[];

  @ApiProperty({ type: () => Ilo })
  @OneToOne(() => Ilo, { onDelete: 'CASCADE' })
  ilo: Ilo;
}
