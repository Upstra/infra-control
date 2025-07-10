import { Injectable } from '@nestjs/common';
import { SystemSettingsService } from '../../domain/services/system-settings.service';

export interface ExportedSettings {
  version: string;
  exportedAt: Date;
  settings: any;
}

@Injectable()
export class ExportSettingsUseCase {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  async execute(): Promise<ExportedSettings> {
    const settings = await this.systemSettingsService.getSettings();
    
    return {
      version: '1.0',
      exportedAt: new Date(),
      settings: settings.settings,
    };
  }
}