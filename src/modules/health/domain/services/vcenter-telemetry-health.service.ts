import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { VMWARE_KEYS } from '@/modules/vmware/application/services/vmware-telemetry-cache.service';
import {
  IHealthCheckService,
  HealthCheckResult,
} from '../interfaces/health-check.interface';

const DEFAULT_INTERVAL_SECONDS = 60;
// Same tolerance as the telemetry scheduler: three missed collections.
const STALE_FACTOR = 3;

/**
 * Freshness of the vCenter snapshot the Pulse collector writes every
 * interval. A stale snapshot means VM / host states shown everywhere in the
 * app (and used by the shutdown plan) are out of date.
 */
@Injectable()
export class VcenterTelemetryHealthService implements IHealthCheckService {
  constructor(
    private readonly redis: RedisSafeService,
    private readonly configService: ConfigService,
    @InjectRepository(Server)
    private readonly servers: Repository<Server>,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const vcenters = await this.servers.count({ where: { type: 'vcenter' } });
    if (!vcenters) {
      return {
        name: 'vcenter',
        status: 'unknown',
        message: 'No vCenter configured',
        responseTime: Date.now() - startTime,
      };
    }

    const intervalSeconds = Number(
      this.configService.get('VMWARE_METRICS_INTERVAL_SECONDS') ??
        DEFAULT_INTERVAL_SECONDS,
    );
    const collectedAt = await this.redis.safeGet(VMWARE_KEYS.collectedAt);
    const ageSeconds = collectedAt
      ? Math.max(0, Math.round((Date.now() - Date.parse(collectedAt)) / 1000))
      : null;
    const fresh =
      ageSeconds !== null && ageSeconds <= intervalSeconds * STALE_FACTOR;

    return {
      name: 'vcenter',
      status: fresh ? 'up' : 'down',
      message:
        ageSeconds === null
          ? 'No vCenter snapshot collected yet'
          : `Last vCenter snapshot ${ageSeconds}s ago`,
      responseTime: Date.now() - startTime,
      details: { collectedAt, ageSeconds, intervalSeconds },
    };
  }
}
