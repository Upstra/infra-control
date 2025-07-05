import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DashboardLayout } from './dashboard-layout.entity';

export enum WidgetType {
  STATS = 'stats',
  ACTIVITY_FEED = 'activity-feed',
  ALERTS = 'alerts',
  RESOURCE_USAGE = 'resource-usage',
  USER_PRESENCE = 'user-presence',
  SYSTEM_HEALTH = 'system-health',
  UPS_STATUS = 'ups-status',
}

interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

@Entity('dashboard_widgets')
export class DashboardWidget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: WidgetType,
    enumName: 'widget_type',
  })
  type: WidgetType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'jsonb', name: 'position' })
  position: WidgetPosition;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ name: 'refresh_interval', type: 'int', nullable: true })
  refreshInterval?: number;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @Column({ name: 'layout_id', type: 'uuid' })
  layoutId: string;

  @ManyToOne(() => DashboardLayout, (layout) => layout.widgets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'layout_id' })
  layout: DashboardLayout;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
