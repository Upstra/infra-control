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

  @ApiProperty({
    description: 'User who performed the action',
    required: false,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  userId?: string;

  @ApiProperty({ description: 'Previous state of the entity', required: false })
  @Column({ type: 'jsonb', nullable: true })
  oldValue?: Record<string, any>;

  @ApiProperty({ description: 'New state of the entity', required: false })
  @Column({ type: 'jsonb', nullable: true })
  newValue?: Record<string, any>;

  @ApiProperty({
    description: 'Additional metadata and context',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'IP address of the user performing the action',
    required: false,
  })
  @Column({ nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent of the client', required: false })
  @Column({ nullable: true })
  userAgent?: string;

  @ApiProperty({
    description: 'Correlation ID for tracking related events',
    required: false,
  })
  @Column({ nullable: true })
  correlationId?: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;
}
