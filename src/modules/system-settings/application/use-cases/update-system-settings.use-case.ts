import { Injectable, Inject } from '@nestjs/common';
import { SystemSettingsService } from '../../domain/services/system-settings.service';
import { SystemSettingsData } from '../../domain/entities/system-settings.entity';
import { UpdateSystemSettingsDto } from '../dto/update-system-settings.dto';
import { LogHistoryUseCase } from '../../../history/application/use-cases/log-history.use-case';

@Injectable()
export class UpdateSystemSettingsUseCase {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
        @Inject(LogHistoryUseCase)
    private readonly logHistoryUseCase: LogHistoryUseCase,
  ) {}

  async execute(
    updates: UpdateSystemSettingsDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SystemSettingsData> {
    const updatedSettings = await this.systemSettingsService.updateSettings(
      updates as Partial<SystemSettingsData>,
      userId,
      ipAddress,
      userAgent,
    );
    return updatedSettings.settings;
  }
}