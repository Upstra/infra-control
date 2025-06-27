import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/domain/entities/user.entity';

@Entity('history_event')
export class HistoryEvent extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Entity type, e.g. user, server' })
  @Column()
  entity!: string;

  @ApiProperty({ description: 'Identifier of the entity instance' })
  @Column()
  entityId!: string;

  @ApiProperty({ description: 'Action performed like CREATE, UPDATE, DELETE' })
  @Column()
  action!: string;

  @ApiProperty({ description: 'User who performed the action', required: false })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  userId?: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
