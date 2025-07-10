import { Injectable } from '@nestjs/common';
import { SystemSettingsService } from '../../domain/services/system-settings.service';
import { SystemSettingsData } from '../../domain/entities/system-settings.entity';

export interface ExportedSettings {
  version: string;
  exportedAt: string;
  settings: SystemSettingsData;
}

@Injectable()
export class ExportSettingsUseCase {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  async execute(): Promise<ExportedSettings> {
    const settings = await this.systemSettingsService.getSettings();

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: settings.settings,
    };
  }
}
