import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/domain/entities/user.entity';
import { AlertSeverity, AlertTransitionType } from '../types/alert.types';
import { Alert } from './alert.entity';

@Entity('alert_transition')
@Index('IDX_alert_transition_at', ['at'])
export class AlertTransition extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  alertId!: string;

  @ManyToOne(() => Alert, (alert) => alert.transitions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'alertId' })
  alert?: Alert;

  @ApiProperty({ enum: AlertTransitionType })
  @Column({ type: 'enum', enum: AlertTransitionType })
  type!: AlertTransitionType;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  at!: Date;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: 'uuid', nullable: true })
  byUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'byUserId' })
  byUser?: User | null;

  @ApiProperty({ enum: AlertSeverity, nullable: true })
  @Column({ type: 'enum', enum: AlertSeverity, nullable: true })
  fromSeverity!: AlertSeverity | null;

  @ApiProperty({ enum: AlertSeverity, nullable: true })
  @Column({ type: 'enum', enum: AlertSeverity, nullable: true })
  toSeverity!: AlertSeverity | null;
}
