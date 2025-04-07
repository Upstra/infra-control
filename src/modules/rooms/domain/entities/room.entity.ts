import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Ups } from '../../../ups/domain/entities/ups.entity';

@Entity('room')
export class Room extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @OneToMany(() => Server, (server) => server.room)
  servers: Server[];

  @OneToMany(() => Ups, (ups) => ups.room)
  ups: Ups[];
}
