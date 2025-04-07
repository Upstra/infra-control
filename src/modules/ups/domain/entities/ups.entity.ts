import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Room } from '../../../rooms/domain/entities/room.entity';

@Entity('ups')
export class Ups extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  ip!: string;

  @Column({ type: 'varchar' })
  login!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column()
  grace_period_on!: number;

  @Column()
  grace_period_off!: number;

  @OneToMany(() => Server, (server) => server.ups)
  servers: Server[];

  @ManyToOne(() => Room, (room) => room.ups)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column()
  roomId!: string;
}
