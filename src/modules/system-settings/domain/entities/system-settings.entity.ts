import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface SecuritySettings {
  registrationEnabled: boolean;
  requireEmailVerification: boolean;
  defaultUserRole: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: PasswordPolicy;
  allowGuestAccess: boolean;
}

export interface ApiSettings {
  enabled: boolean;
  rateLimit: number;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maxUploadSize: number;
  allowedFileTypes: string[];
  api: ApiSettings;
  enableWebSockets: boolean;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
}

export interface EmailFrom {
  name: string;
  address: string;
}

export interface EmailSettings {
  enabled: boolean;
  smtp: SmtpSettings;
  from: EmailFrom;
}

export interface BackupSchedule {
  interval: number;
  retention: number;
}

export interface BackupStorage {
  type: 'local' | 's3' | 'azure';
  path?: string;
  credentials?: Record<string, string>;
}

export interface BackupSettings {
  enabled: boolean;
  schedule: BackupSchedule;
  storage: BackupStorage;
}

export interface MetricsSettings {
  enabled: boolean;
  retention: number;
}

export interface LoggingSettings {
  level: 'debug' | 'info' | 'warn' | 'error';
  retention: number;
  metrics: MetricsSettings;
}

export interface SystemSettingsData {
  security: SecuritySettings;
  system: SystemConfig;
  email: EmailSettings;
  backup: BackupSettings;
  logging: LoggingSettings;
}

@Entity('system_settings')
export class SystemSettings {
  @PrimaryColumn({ type: 'varchar', length: 36, default: 'singleton' })
  id: string = 'singleton';

  @Column({ type: 'jsonb' })
  settings: SystemSettingsData;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: User;
}
