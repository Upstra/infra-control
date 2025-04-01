import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';

@Entity('group')
export class Group extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'varchar' })
  type!: string;

  @ApiProperty()
  @Column()
  priority: number;

  @OneToMany(() => Server, (server) => server.group)
  servers: Server[];

  @OneToMany(() => Vm, (vm) => vm.group)
  vms: Vm[];
}
