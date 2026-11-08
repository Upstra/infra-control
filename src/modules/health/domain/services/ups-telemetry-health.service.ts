import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import {
  IHealthCheckService,
  HealthCheckResult,
} from '../interfaces/health-check.interface';

// Must match UpsBatteryCacheService; kept local to avoid a module cycle.
const BATTERY_KEY = (upsId: string) => `ups:battery:${upsId}`;
// The poller runs every minute (UPS_POLL_CRON): three missed polls is stale.
const STALE_SECONDS = 180;

/**
 * Freshness of the battery readings the UPS poller caches. Without fresh
 * readings Upstra cannot notice a power cut, which is the whole point of the
 * product, so every configured UPS is checked.
 */
@Injectable()
export class UpsTelemetryHealthService implements IHealthCheckService {
  constructor(
    private readonly redis: RedisSafeService,
    @InjectRepository(Ups)
    private readonly upsRepository: Repository<Ups>,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const upsList = await this.upsRepository.find({
      select: { id: true, name: true },
    });
    if (!upsList.length) {
      return {
        name: 'ups',
        status: 'unknown',
        message: 'No UPS configured',
        responseTime: Date.now() - startTime,
      };
    }

    const raw = await this.redis.safeMGet(upsList.map((u) => BATTERY_KEY(u.id)));
    const stale = upsList.filter((ups, index) => {
      const ageSeconds = this.ageSeconds(raw?.[index] ?? null);
      return ageSeconds === null || ageSeconds > STALE_SECONDS;
    });

    return {
      name: 'ups',
      status: stale.length ? 'down' : 'up',
      message: stale.length
        ? `No recent reading for ${stale.map((u) => u.name).join(', ')}`
        : `${upsList.length} UPS reporting`,
      responseTime: Date.now() - startTime,
      details: {
        total: upsList.length,
        stale: stale.map((u) => u.name),
      },
    };
  }

  private ageSeconds(value: string | null): number | null {
    if (!value) return null;
    try {
      const timestamp = Date.parse(JSON.parse(value).timestamp);
      return Number.isNaN(timestamp)
        ? null
        : Math.round((Date.now() - timestamp) / 1000);
    } catch {
      return null;
    }
  }
}
