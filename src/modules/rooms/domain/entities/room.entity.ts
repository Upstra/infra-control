import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Ups } from '../../../ups/domain/entities/ups.entity';

@Entity('room')
export class Room extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'varchar' })
  name!: string;

  @ApiProperty({ type: () => Server, isArray: true })
  @OneToMany(() => Server, (server) => server.room)
  servers: Server[];

  @ApiProperty({ type: () => Ups, isArray: true })
  @OneToMany(() => Ups, (ups) => ups.room)
  ups: Ups[];
}
