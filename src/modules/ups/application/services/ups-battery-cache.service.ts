import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';
import { UpsBatteryEvents } from '../../domain/events/ups-battery.events';

@Injectable()
export class UpsBatteryCacheService {
  private readonly cacheTTL: number;
  private readonly cacheKeyPrefix = 'ups:battery:';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.cacheTTL = this.configService.get<number>(
      'UPS_BATTERY_CACHE_TTL_SECONDS',
      300,
    );
  }

  async get(upsId: string): Promise<UPSBatteryStatusDto | null> {
    const key = this.getCacheKey(upsId);
    return await this.cacheManager.get<UPSBatteryStatusDto>(key);
  }

  async set(upsId: string, status: UPSBatteryStatusDto): Promise<void> {
    const key = this.getCacheKey(upsId);
    await this.cacheManager.set(key, status, this.cacheTTL * 1000);
  }

  async delete(upsId: string): Promise<void> {
    const key = this.getCacheKey(upsId);
    await this.cacheManager.del(key);
  }

  async getMultiple(
    upsIds: string[],
  ): Promise<Record<string, UPSBatteryStatusDto | null>> {
    const results: Record<string, UPSBatteryStatusDto | null> = {};
    
    await Promise.all(
      upsIds.map(async (upsId) => {
        results[upsId] = await this.get(upsId);
      }),
    );

    return results;
  }

  async setMultiple(
    statuses: Record<string, UPSBatteryStatusDto>,
  ): Promise<void> {
    await Promise.all(
      Object.entries(statuses).map(([upsId, status]) =>
        this.set(upsId, status),
      ),
    );
  }

  @OnEvent(UpsBatteryEvents.BATTERY_CHECKED)
  async handleBatteryChecked(status: UPSBatteryStatusDto) {
    await this.set(status.upsId, status);
  }

  @OnEvent(UpsBatteryEvents.BATCH_CHECKED)
  async handleBatchChecked(payload: {
    results: UPSBatteryStatusDto[];
  }) {
    const statusMap: Record<string, UPSBatteryStatusDto> = {};
    payload.results.forEach((status) => {
      statusMap[status.upsId] = status;
    });
    await this.setMultiple(statusMap);
  }

  private getCacheKey(upsId: string): string {
    return `${this.cacheKeyPrefix}${upsId}`;
  }
}