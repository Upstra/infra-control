import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';
import { UpsBatteryEvents } from '../../domain/events/ups-battery.events';
import { RedisSafeService } from '../../../redis/application/services/redis-safe.service';

@Injectable()
export class UpsBatteryCacheService {
  private readonly cacheTTL: number;
  private readonly cacheKeyPrefix = 'ups:battery:';

  constructor(
    private readonly redisSafeService: RedisSafeService,
    private configService: ConfigService,
  ) {
    this.cacheTTL = this.configService.get<number>(
      'UPS_BATTERY_CACHE_TTL_SECONDS',
      300,
    );
  }

  async get(upsId: string): Promise<UPSBatteryStatusDto | null> {
    const key = this.getCacheKey(upsId);
    const data = await this.redisSafeService.safeGet(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as UPSBatteryStatusDto;
    } catch {
      return null;
    }
  }

  async set(upsId: string, status: UPSBatteryStatusDto): Promise<void> {
    const key = this.getCacheKey(upsId);
    const value = JSON.stringify(status);
    await this.redisSafeService.safeSetEx(key, this.cacheTTL, value);
  }

  async delete(upsId: string): Promise<void> {
    const key = this.getCacheKey(upsId);
    await this.redisSafeService.safeDel(key);
  }

  async getMultiple(
    upsIds: string[],
  ): Promise<Record<string, UPSBatteryStatusDto | null>> {
    if (upsIds.length === 0) return {};

    const keys = upsIds.map((id) => this.getCacheKey(id));
    const values = await this.redisSafeService.safeMGet(keys);

    const results: Record<string, UPSBatteryStatusDto | null> = {};

    upsIds.forEach((upsId, index) => {
      const value = values[index];
      if (!value) {
        results[upsId] = null;
      } else {
        try {
          results[upsId] = JSON.parse(value) as UPSBatteryStatusDto;
        } catch {
          results[upsId] = null;
        }
      }
    });

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
  async handleBatchChecked(payload: { results: UPSBatteryStatusDto[] }) {
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
