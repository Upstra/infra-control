import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/domain/entities/user.entity';
import {
  AlertResourceType,
  AlertSeverity,
  AlertStatus,
} from '../types/alert.types';
import { AlertTransition } from './alert-transition.entity';

@Entity('alert')
@Index('UQ_alert_open_dedup_key', ['dedupKey'], {
  unique: true,
  where: `"status" = 'open'`,
})
@Index('IDX_alert_status_severity_opened_at', [
  'status',
  'severity',
  'openedAt',
])
export class Alert extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'ups:3f2c…:on_battery' })
  @Column({ type: 'varchar' })
  dedupKey!: string;

  @ApiProperty({ example: 'ups_on_battery' })
  @Column({ type: 'varchar' })
  type!: string;

  @ApiProperty({ enum: AlertSeverity })
  @Column({ type: 'enum', enum: AlertSeverity })
  severity!: AlertSeverity;

  @ApiProperty({ enum: AlertStatus })
  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.OPEN })
  status!: AlertStatus;

  @ApiProperty({ enum: AlertResourceType })
  @Column({ type: 'enum', enum: AlertResourceType })
  resourceType!: AlertResourceType;

  @ApiProperty()
  @Column({ type: 'uuid' })
  resourceId!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  resourceName!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  title!: string;

  @ApiProperty()
  @Column({ type: 'text' })
  message!: string;

  @ApiProperty({ type: Object, nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  openedAt!: Date;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  lastSeenAt!: Date;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  acknowledgedAt!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: 'uuid', nullable: true })
  acknowledgedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'acknowledgedById' })
  acknowledgedBy?: User | null;

  @ApiProperty()
  @Column({ type: 'int', default: 1 })
  occurrences!: number;

  @OneToMany(() => AlertTransition, (transition) => transition.alert)
  transitions?: AlertTransition[];
}
