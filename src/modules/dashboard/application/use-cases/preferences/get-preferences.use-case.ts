import { Injectable } from '@nestjs/common';
import { DashboardPreferenceRepository } from '../../../infrastructure/repositories/dashboard-preference.repository';
import { DashboardPreferenceResponseDto } from '../../dto/dashboard-preference.dto';
import { DashboardPreference } from '../../../domain/entities/dashboard-preference.entity';

@Injectable()
export class GetPreferencesUseCase {
  constructor(
    private readonly preferenceRepository: DashboardPreferenceRepository,
  ) {}

  async execute(userId: string): Promise<DashboardPreferenceResponseDto> {
    let preference = await this.preferenceRepository.findByUserId(userId);

    if (!preference) {
      const newPreference = {
        userId,
        refreshInterval: 30000,
        theme: 'light' as const,
        notifications: {
          alerts: true,
          activities: false,
        },
      };

      preference = await this.preferenceRepository.create(newPreference);
    }

    return {
      defaultLayoutId: preference.defaultLayoutId,
      refreshInterval: preference.refreshInterval,
      theme: preference.theme,
      notifications: preference.notifications,
    };
  }
}
