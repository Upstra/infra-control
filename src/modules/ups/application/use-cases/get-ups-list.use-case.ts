import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../dto/ups.response.dto';
import { UpsListResponseDto } from '../dto';
import { UpsBatteryCacheService } from '../services/ups-battery-cache.service';
import { BatteryStatusResponseDto } from '../dto/battery-status.response.dto';

@Injectable()
export class GetUpsListUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly repo: UpsRepositoryInterface,
    private readonly upsBatteryCacheService: UpsBatteryCacheService,
  ) {}

  /**
   * Retrieve a paginated list of UPS.
   *
   * @param page - page number starting at 1
   * @param limit - number of UPS per page
   */
  async execute(page = 1, limit = 10): Promise<UpsListResponseDto> {
    const [upsWithCount, total] = await this.repo.paginateWithServerCount(
      page,
      limit,
    );

    const upsIds = upsWithCount.map(({ ups }) => ups.id);
    const cachedBatteryStatuses = await this.upsBatteryCacheService.getMultiple(
      upsIds,
    );

    const dtos = upsWithCount.map(({ ups, serverCount }) => {
      const cachedStatus = cachedBatteryStatuses[ups.id];
      const batteryStatus = cachedStatus
        ? new BatteryStatusResponseDto(cachedStatus)
        : undefined;

      return new UpsResponseDto(ups, serverCount, batteryStatus);
    });

    return new UpsListResponseDto(dtos, total, page, limit);
  }
}
