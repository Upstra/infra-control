import { ApiProperty } from '@nestjs/swagger';
import { SystemSettingsData } from '../../domain/entities/system-settings.entity';

export class SystemSettingsResponseDto implements SystemSettingsData {
  @ApiProperty()
  security: {
    registrationEnabled: boolean;
    requireEmailVerification: boolean;
    defaultUserRole: string;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    allowGuestAccess: boolean;
  };

  @ApiProperty()
  system: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    maxUploadSize: number;
    allowedFileTypes: string[];
    api: {
      enabled: boolean;
      rateLimit: number;
    };
    enableWebSockets: boolean;
  };

  @ApiProperty()
  email: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password?: string;
    };
    from: {
      name: string;
      address: string;
    };
  };

  @ApiProperty()
  backup: {
    enabled: boolean;
    schedule: {
      interval: number;
      retention: number;
    };
    storage: {
      type: 'local' | 's3' | 'azure';
      path?: string;
      credentials?: Record<string, string>;
    };
  };

  @ApiProperty()
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number;
    metrics: {
      enabled: boolean;
      retention: number;
    };
  };
}

export class ExportSettingsResponseDto {
  @ApiProperty()
  version: string;

  @ApiProperty()
  exportedAt: Date;

  @ApiProperty()
  settings: SystemSettingsResponseDto;
}
