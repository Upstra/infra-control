import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Room } from '../../../rooms/domain/entities/room.entity';

@Entity('ups')
export class Ups extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  name!: string;

  @ApiProperty()
  @Column({ type: 'varchar', unique: true })
  ip!: string;

  @ApiProperty()
  @Column()
  grace_period_on: number;

  @ApiProperty()
  @Column()
  grace_period_off: number;

  @ApiProperty({ type: () => Server, isArray: true })
  @OneToMany(() => Server, (server) => server.ups)
  servers: Server[];

  @ApiProperty({ type: () => Room })
  @ManyToOne(() => Room, (room) => room.ups)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ApiProperty()
  @Column()
  roomId!: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
