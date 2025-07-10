import { Injectable } from '@nestjs/common';
import { SystemSettingsService } from '../../domain/services/system-settings.service';
import { SystemSettingsData } from '../../domain/entities/system-settings.entity';
import { UpdateSystemSettingsDto } from '../dto/update-system-settings.dto';

@Injectable()
export class UpdateSystemSettingsUseCase {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  async execute(
    updates: UpdateSystemSettingsDto,
    userId: string,
  ): Promise<SystemSettingsData> {
    const updatedSettings = await this.systemSettingsService.updateSettings(
      updates as Partial<SystemSettingsData>,
      userId,
    );
    return updatedSettings.settings;
  }
}