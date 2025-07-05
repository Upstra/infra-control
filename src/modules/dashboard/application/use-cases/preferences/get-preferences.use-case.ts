import { Injectable, Inject } from '@nestjs/common';
import { IDashboardPreferenceRepository } from '../../../domain/interfaces/dashboard-preference.repository.interface';
import { DashboardPreferenceResponseDto } from '../../dto/dashboard-preference.dto';
import { DashboardPreference } from '../../../domain/entities/dashboard-preference.entity';

@Injectable()
export class GetPreferencesUseCase {
  constructor(
    @Inject('DashboardPreferenceRepository')
    private readonly preferenceRepository: IDashboardPreferenceRepository,
  ) {}

  async execute(userId: string): Promise<DashboardPreferenceResponseDto> {
    let preference = await this.preferenceRepository.findByUserId(userId);

    if (!preference) {
      preference = new DashboardPreference();
      preference.userId = userId;
      preference.refreshInterval = 30000;
      preference.theme = 'light';
      preference.notifications = {
        alerts: true,
        activities: false,
      };

      preference = await this.preferenceRepository.save(preference);
    }

    return {
      defaultLayoutId: preference.defaultLayoutId,
      refreshInterval: preference.refreshInterval,
      theme: preference.theme,
      notifications: preference.notifications,
    };
  }
}
