import { Injectable, Inject } from '@nestjs/common';
import { SystemSettingsService } from '../../domain/services/system-settings.service';
import { SystemSettingsData } from '../../domain/entities/system-settings.entity';
import { SettingsImportException } from '../../domain/exceptions/system-settings.exceptions';
import { LogHistoryUseCase } from '../../../history/application/use-cases/log-history.use-case';

export interface ImportSettingsData {
  version: string;
  exportedAt: Date;
  settings: SystemSettingsData;
}

@Injectable()
export class ImportSettingsUseCase {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
    @Inject(LogHistoryUseCase)
    private readonly logHistoryUseCase: LogHistoryUseCase,
  ) {}

  async execute(
    importData: ImportSettingsData,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SystemSettingsData> {
    if (!importData.version || !importData.settings) {
      throw new SettingsImportException('Invalid import data format');
    }

    if (importData.version !== '1.0') {
      throw new SettingsImportException(
        `Unsupported settings version: ${importData.version}`,
      );
    }

    const validationResult = this.validateSettings(importData.settings);
    if (!validationResult.valid) {
      throw new SettingsImportException(
        `Invalid settings structure: ${validationResult.error}`,
      );
    }

    const updatedSettings = await this.systemSettingsService.updateSettings(
      importData.settings,
      userId,
      ipAddress,
      userAgent,
    );

    await this.logHistoryUseCase.executeStructured({
      entity: 'system_settings',
      entityId: 'singleton',
      action: 'IMPORT',
      userId,
      oldValue: {},
      newValue: importData.settings,
      metadata: {
        version: importData.version,
        exportedAt: importData.exportedAt,
      },
      ipAddress,
      userAgent,
    });

    return updatedSettings.settings;
  }

  private validateSettings(settings: any): { valid: boolean; error?: string } {
    const requiredCategories = [
      'security',
      'system',
      'email',
      'backup',
      'logging',
    ];

    for (const category of requiredCategories) {
      if (!settings[category]) {
        return {
          valid: false,
          error: `Missing required category: ${category}`,
        };
      }
    }

    if (
      settings.security &&
      typeof settings.security.passwordPolicy !== 'object'
    ) {
      return {
        valid: false,
        error: 'Invalid security.passwordPolicy structure',
      };
    }

    if (settings.email && typeof settings.email.smtp !== 'object') {
      return { valid: false, error: 'Invalid email.smtp structure' };
    }

    return { valid: true };
  }
}
