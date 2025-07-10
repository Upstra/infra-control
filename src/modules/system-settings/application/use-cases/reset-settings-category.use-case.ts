import { Injectable } from '@nestjs/common';
import { SystemSettingsService } from '../../domain/services/system-settings.service';
import { SystemSettingsData } from '../../domain/entities/system-settings.entity';
import { DefaultSettingsService } from '../../domain/services/default-settings.service';
import { InvalidSettingsCategoryException } from '../../domain/exceptions/system-settings.exceptions';

@Injectable()
export class ResetSettingsCategoryUseCase {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
    private readonly defaultSettingsService: DefaultSettingsService,
  ) {}

  async execute(
    category: string,
    userId: string,
  ): Promise<SystemSettingsData> {
    if (!this.defaultSettingsService.isValidCategory(category)) {
      throw new InvalidSettingsCategoryException(category);
    }

    const updatedSettings = await this.systemSettingsService.resetCategory(
      category as keyof SystemSettingsData,
      userId,
    );
    
    return updatedSettings.settings;
  }
}