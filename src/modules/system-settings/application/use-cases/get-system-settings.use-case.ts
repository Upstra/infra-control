import { Injectable } from '@nestjs/common';
import { SystemSettingsService } from '../../domain/services/system-settings.service';
import { SystemSettingsData } from '../../domain/entities/system-settings.entity';

@Injectable()
export class GetSystemSettingsUseCase {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  async execute(): Promise<SystemSettingsData> {
    const settings = await this.systemSettingsService.getSettings();
    return settings.settings;
  }
}
