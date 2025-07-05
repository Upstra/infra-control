import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';

interface NotificationPreferences {
  alerts: boolean;
  activities: boolean;
}

@Entity('dashboard_preferences')
export class DashboardPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'default_layout_id', type: 'uuid', nullable: true })
  defaultLayoutId?: string;

  @Column({ name: 'refresh_interval', type: 'int', default: 30000 })
  refreshInterval: number;

  @Column({ type: 'varchar', length: 20, default: 'light' })
  theme: 'light' | 'dark';

  @Column({ type: 'jsonb', default: { alerts: true, activities: false } })
  notifications: NotificationPreferences;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
