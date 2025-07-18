import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../dto/ups.response.dto';
import { UpsListResponseDto } from '../dto';
import { GetUpsBatteryUseCase } from './get-ups-battery.use-case';
import { BatteryStatusResponseDto } from '../dto/battery-status.response.dto';

@Injectable()
export class GetUpsListUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly repo: UpsRepositoryInterface,
    private readonly getUpsBatteryUseCase: GetUpsBatteryUseCase,
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

    const dtos = await Promise.all(
      upsWithCount.map(async ({ ups, serverCount }) => {
        let batteryStatus: BatteryStatusResponseDto | undefined;

        try {
          const batteryData = await this.getUpsBatteryUseCase.execute(ups.id);
          batteryStatus = new BatteryStatusResponseDto(batteryData);
        } catch {
          batteryStatus = undefined;
        }

        return new UpsResponseDto(ups, serverCount, batteryStatus);
      }),
    );

    return new UpsListResponseDto(dtos, total, page, limit);
  }
}
