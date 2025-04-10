import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToOne,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Server } from '../../../servers/domain/entities/server.entity';

@Entity('ilo')
export class Ilo extends BaseEntity {
  @ApiProperty()
  @PrimaryColumn('uuid')
  id!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  name!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  ip!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  login!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  password!: string;

  @ApiProperty({ type: () => Server })
  @OneToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  server!: Server;
}
