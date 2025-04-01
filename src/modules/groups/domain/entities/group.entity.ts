import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../../servers/domain/entities/server.entity';
import { VM } from '../../../vms/domain/entities/vm.entity';

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

  @ManyToOne(() => Server, (server) => server.group)
  servers: Server[];

  @ManyToOne(() => VM, (vm) => vm.group)
  vms: VM[];
}
