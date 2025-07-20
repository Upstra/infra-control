import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Group } from '../../../groups/domain/entities/group.entity';
import { Room } from '../../../rooms/domain/entities/room.entity';
import { Ups } from '../../../ups/domain/entities/ups.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { PermissionServer } from '../../../permissions/domain/entities/permission.server.entity';
import { Ilo } from '../../../ilos/domain/entities/ilo.entity';
import { EncryptionTransformer } from '@/core/transformers/encryption.transformer';

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
  @Column({ type: 'varchar' })
  adminUrl: string;

  @ApiProperty()
  @Column({ type: 'varchar', unique: true })
  ip!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  login!: string;

  @ApiProperty({ writeOnly: true })
  @Column({
    type: 'varchar',
    select: false,
    transformer: new EncryptionTransformer(),
  })
  password!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  type: string;

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

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  vmwareHostMoid?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  vmwareVCenterIp?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  vmwareCluster?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  vmwareVendor?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  vmwareModel?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  vmwareCpuCores?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  vmwareCpuThreads?: number;

  @ApiProperty({ required: false })
  @Column({ type: 'float', nullable: true })
  vmwareCpuMHz?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  vmwareRamTotal?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
