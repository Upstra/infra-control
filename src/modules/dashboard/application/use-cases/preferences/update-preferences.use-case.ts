import { Injectable } from '@nestjs/common';
import { DashboardPreferenceRepository } from '../../../infrastructure/repositories/dashboard-preference.repository';
import { DashboardLayoutRepository } from '../../../infrastructure/repositories/dashboard-layout.repository';
import {
  DashboardPreferenceResponseDto,
  UpdateDashboardPreferenceDto,
} from '../../dto/dashboard-preference.dto';
import { DashboardLayoutNotFoundException } from '../../../domain/exceptions/dashboard.exception';

@Injectable()
export class UpdatePreferencesUseCase {
  constructor(
    private readonly preferenceRepository: DashboardPreferenceRepository,
    private readonly layoutRepository: DashboardLayoutRepository,
  ) {}

  async execute(
    userId: string,
    dto: UpdateDashboardPreferenceDto,
  ): Promise<DashboardPreferenceResponseDto> {
    if (dto.defaultLayoutId) {
      const layout = await this.layoutRepository.findByIdAndUserId(
        dto.defaultLayoutId,
        userId,
      );

      if (!layout) {
        throw new DashboardLayoutNotFoundException(dto.defaultLayoutId);
      }
    }

    const updateData: any = {
      userId,
      ...dto,
    };

    const preference = await this.preferenceRepository.upsert(updateData);

    return {
      defaultLayoutId: preference.defaultLayoutId,
      refreshInterval: preference.refreshInterval,
      theme: preference.theme,
      notifications: preference.notifications,
    };
  }
}
