import { Injectable } from '@nestjs/common';
import { SystemSettingsService } from '../../domain/services/system-settings.service';
import { SystemSettingsData } from '../../domain/entities/system-settings.entity';

@Injectable()
export class UpdateSystemSettingsUseCase {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  async execute(
    updates: Partial<SystemSettingsData>,
    userId: string,
  ): Promise<SystemSettingsData> {
    const updatedSettings = await this.systemSettingsService.updateSettings(
      updates,
      userId,
    );
    return updatedSettings.settings;
  }
}