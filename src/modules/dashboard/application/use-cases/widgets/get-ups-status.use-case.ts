import { Injectable, Inject } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../../../ups/domain/interfaces/ups.repository.interface';
import { UpsBatteryCacheService } from '../../../../ups/application/services/ups-battery-cache.service';
import { UpsStatusResponseDto, UpsStatusDto } from '../../dto/widget-data.dto';

@Injectable()
export class GetUpsStatusUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    @Inject(UpsBatteryCacheService)
    private readonly upsBatteryCacheService: UpsBatteryCacheService,
  ) {}

  async execute(): Promise<UpsStatusResponseDto> {
    const upsList = await this.upsRepository.findAll();
    
    if (!upsList || upsList.length === 0) {
      return {
        ups: [],
        summary: {
          total: 0,
          online: 0,
          onBattery: 0,
          offline: 0,
          unavailable: 0,
          averageLoad: null,
          isMocked: false,
        },
      };
    }

    const upsIds = upsList.map(ups => ups.id);
    const cachedStatuses = await this.upsBatteryCacheService.getMultiple(upsIds);

    const upsStatuses: UpsStatusDto[] = upsList.map((ups) => {
      const cachedData = cachedStatuses[ups.id];
      
      if (cachedData) {
        return {
          id: ups.id,
          name: ups.name,
          status: this.determineUpsStatus(cachedData.minutesRemaining, cachedData.alertLevel),
          batteryLevel: this.calculateBatteryLevel(cachedData.minutesRemaining),
          load: null,
          runtime: cachedData.minutesRemaining,
          temperature: null,
          lastTest: null,
          nextTest: null,
          isMocked: false,
        };
      }
      
      return {
        id: ups.id,
        name: ups.name,
        status: 'unavailable' as const,
        batteryLevel: null,
        load: null,
        runtime: null,
        temperature: null,
        lastTest: null,
        nextTest: null,
        isMocked: false,
      };
    });

    const statusCounts = {
      online: 0,
      onBattery: 0,
      offline: 0,
      unavailable: 0,
    };

    upsStatuses.forEach(ups => {
      statusCounts[ups.status]++;
    });

    const summary = {
      total: upsStatuses.length,
      online: statusCounts.online,
      onBattery: statusCounts.onBattery,
      offline: statusCounts.offline,
      unavailable: statusCounts.unavailable,
      averageLoad: null,
      isMocked: false,
    };

    return {
      ups: upsStatuses,
      summary,
    };
  }

  private determineUpsStatus(minutesRemaining: number | undefined, alertLevel: string): 'online' | 'onBattery' | 'offline' | 'unavailable' {
    if (minutesRemaining === undefined || minutesRemaining === null) {
      return 'unavailable';
    }
    
    if (alertLevel === 'critical' || alertLevel === 'warning' || alertLevel === 'low') {
      return 'onBattery';
    }
    
    if (alertLevel === 'normal') {
      return 'online';
    }
    
    return 'unavailable';
  }

  private calculateBatteryLevel(minutesRemaining: number | undefined): number | null {
    if (minutesRemaining === undefined || minutesRemaining === null) {
      return null;
    }
    
    const maxRuntime = 120;
    const percentage = Math.min(100, Math.max(0, (minutesRemaining / maxRuntime) * 100));
    return Math.round(percentage);
  }
}
