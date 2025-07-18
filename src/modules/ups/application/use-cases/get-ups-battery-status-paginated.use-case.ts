import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsBatteryCacheService } from '../services/ups-battery-cache.service';
import { GetUpsBatteryUseCase } from './get-ups-battery.use-case';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';

export interface UpsBatteryStatusPaginatedDto {
  data: (UPSBatteryStatusDto & { upsName: string })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable()
export class GetUpsBatteryStatusPaginatedUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly upsBatteryCacheService: UpsBatteryCacheService,
    private readonly getUpsBatteryUseCase: GetUpsBatteryUseCase,
  ) {}

  async execute(
    page = 1,
    limit = 10,
    forceRefresh = false,
  ): Promise<UpsBatteryStatusPaginatedDto> {
    const [upsList, total] = await this.upsRepository.paginate(page, limit);
    const upsIds = upsList.map((ups) => ups.id);

    let batteryStatuses: Record<string, UPSBatteryStatusDto | null>;

    if (forceRefresh) {
      batteryStatuses = {};
      await Promise.all(
        upsList.map(async (ups) => {
          try {
            batteryStatuses[ups.id] = await this.getUpsBatteryUseCase.execute(
              ups.id,
            );
          } catch {
            batteryStatuses[ups.id] = null;
          }
        }),
      );
    } else {
      batteryStatuses = await this.upsBatteryCacheService.getMultiple(upsIds);
      
      const missingIds = upsIds.filter((id) => !batteryStatuses[id]);
      if (missingIds.length > 0) {
        await Promise.all(
          missingIds.map(async (upsId) => {
            try {
              batteryStatuses[upsId] = await this.getUpsBatteryUseCase.execute(
                upsId,
              );
            } catch {
              batteryStatuses[upsId] = null;
            }
          }),
        );
      }
    }

    const data = upsList
      .map((ups) => {
        const status = batteryStatuses[ups.id];
        if (!status) return null;
        return {
          ...status,
          upsName: ups.name,
        };
      })
      .filter((item): item is UPSBatteryStatusDto & { upsName: string } => 
        item !== null,
      );

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}