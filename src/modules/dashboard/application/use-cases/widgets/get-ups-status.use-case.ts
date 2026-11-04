import { Injectable, Inject } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../../../ups/domain/interfaces/ups.repository.interface';
import { UpsBatteryCacheService } from '../../../../ups/application/services/ups-battery-cache.service';
import { UPSBatteryStatusDto } from '../../../../ups/domain/interfaces/ups-battery-status.interface';
import { Ups } from '../../../../ups/domain/entities/ups.entity';
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
    const cachedStatuses = await this.upsBatteryCacheService.getMultiple(
      (upsList ?? []).map((ups) => ups.id),
    );

    const upsStatuses = (upsList ?? []).map((ups) =>
      this.toUpsStatus(ups, cachedStatuses[ups.id] ?? null),
    );

    const statusCounts = {
      online: 0,
      onBattery: 0,
      offline: 0,
      unavailable: 0,
    };
    upsStatuses.forEach((ups) => statusCounts[ups.status]++);

    return {
      ups: upsStatuses,
      summary: {
        total: upsStatuses.length,
        ...statusCounts,
        averageLoad: this.averageLoad(upsStatuses),
        isMocked: false,
      },
    };
  }

  private toUpsStatus(
    ups: Ups,
    cached: UPSBatteryStatusDto | null,
  ): UpsStatusDto {
    if (!cached) {
      return {
        id: ups.id,
        name: ups.name,
        status: 'unavailable',
        batteryLevel: null,
        load: null,
        runtime: null,
        temperature: null,
        lastTest: null,
        nextTest: null,
        isMocked: false,
      };
    }

    const telemetry = cached.telemetry ?? null;
    return {
      id: ups.id,
      name: ups.name,
      status: cached.onBattery === true ? 'onBattery' : 'online',
      batteryLevel: telemetry?.battery.chargePercent ?? null,
      load: telemetry?.load.percent ?? null,
      runtime: cached.minutesRemaining ?? null,
      temperature: telemetry?.temperatureC ?? null,
      lastTest: this.toDate(telemetry?.battery.lastTestAt ?? null),
      nextTest: null,
      isMocked: false,
    };
  }

  private averageLoad(statuses: UpsStatusDto[]): number | null {
    const loads = statuses
      .map((ups) => ups.load)
      .filter((load): load is number => load !== null);
    if (loads.length === 0) return null;
    const total = loads.reduce((sum, load) => sum + load, 0);
    return Math.round((total / loads.length) * 10) / 10;
  }

  private toDate(value: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
