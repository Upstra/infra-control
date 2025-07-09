import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/modules/users/domain/entities/user.entity';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['fr', 'en'],
    default: 'fr',
  })
  locale: 'fr' | 'en';

  @Column({
    type: 'enum',
    enum: ['light', 'dark'],
    default: 'dark',
  })
  theme: 'light' | 'dark';

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({
    type: 'jsonb',
    default: {
      server: true,
      ups: true,
      email: false,
      push: true,
    },
  })
  notifications: {
    server: boolean;
    ups: boolean;
    email: boolean;
    push: boolean;
  };

  @Column({
    type: 'jsonb',
    default: {
      defaultUserView: 'table',
      defaultServerView: 'grid',
      compactMode: false,
    },
  })
  display: {
    defaultUserView: 'table' | 'card';
    defaultServerView: 'grid' | 'list';
    compactMode: boolean;
  };

  @Column({
    type: 'jsonb',
    default: {},
  })
  integrations: {
    slackWebhook?: string;
    alertEmail?: string;
    discordWebhook?: string;
    teamsWebhook?: string;
  };

  @Column({
    type: 'jsonb',
    default: {
      autoRefresh: true,
      refreshInterval: 60,
    },
  })
  performance: {
    autoRefresh: boolean;
    refreshInterval: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static createDefault(userId: string): UserPreference {
    const preference = new UserPreference();
    preference.userId = userId;
    preference.locale = 'fr';
    preference.theme = 'dark';
    preference.timezone = 'UTC';
    preference.notifications = {
      server: true,
      ups: true,
      email: false,
      push: true,
    };
    preference.display = {
      defaultUserView: 'table',
      defaultServerView: 'grid',
      compactMode: false,
    };
    preference.integrations = {};
    preference.performance = {
      autoRefresh: true,
      refreshInterval: 60,
    };
    return preference;
  }
}