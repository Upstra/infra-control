import { Injectable, Inject } from '@nestjs/common';
import { IDashboardPreferenceRepository } from '../../../domain/interfaces/dashboard-preference.repository.interface';
import { IDashboardLayoutRepository } from '../../../domain/interfaces/dashboard-layout.repository.interface';
import {
  DashboardPreferenceResponseDto,
  UpdateDashboardPreferenceDto,
} from '../../dto/dashboard-preference.dto';
import { DashboardLayoutNotFoundException } from '../../../domain/exceptions/dashboard.exception';

@Injectable()
export class UpdatePreferencesUseCase {
  constructor(
    @Inject('DashboardPreferenceRepository')
    private readonly preferenceRepository: IDashboardPreferenceRepository,
    @Inject('DashboardLayoutRepository')
    private readonly layoutRepository: IDashboardLayoutRepository,
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
