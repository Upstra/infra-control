import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { CollectInventoryMetricsUseCase } from '../use-cases/collect-inventory-metrics.use-case';
import { CollectVcenterEventsUseCase } from '../use-cases/collect-vcenter-events.use-case';
import { VMWARE_KEYS } from '../services/vmware-telemetry-cache.service';

export const VMWARE_METRICS_INTERVAL = 'vmware-metrics';
export const VMWARE_EVENTS_INTERVAL = 'vmware-events';
const DEFAULT_EVENTS_INTERVAL_SECONDS = 30;

@Injectable()
export class VmwareTelemetryScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(VmwareTelemetryScheduler.name);

  constructor(
    private readonly collectMetrics: CollectInventoryMetricsUseCase,
    private readonly collectEvents: CollectVcenterEventsUseCase,
    private readonly redis: RedisSafeService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    if (this.configService.get('VMWARE_TELEMETRY_ENABLED') === 'false') return;
    const metricsSeconds = this.collectMetrics.intervalSeconds();
    const eventsSeconds = Number(
      this.configService.get('VMWARE_EVENTS_INTERVAL_SECONDS') ??
        DEFAULT_EVENTS_INTERVAL_SECONDS,
    );
    this.schedulerRegistry.addInterval(
      VMWARE_METRICS_INTERVAL,
      setInterval(() => this.runMetrics(), metricsSeconds * 1000),
    );
    this.schedulerRegistry.addInterval(
      VMWARE_EVENTS_INTERVAL,
      setInterval(() => this.runEvents(), eventsSeconds * 1000),
    );
  }

  onModuleDestroy(): void {
    [VMWARE_METRICS_INTERVAL, VMWARE_EVENTS_INTERVAL].forEach((name) => {
      if (this.schedulerRegistry.doesExist('interval', name)) {
        this.schedulerRegistry.deleteInterval(name);
      }
    });
  }

  runMetrics(): Promise<boolean> {
    return this.withLock(
      VMWARE_KEYS.metricsLock,
      this.collectMetrics.intervalSeconds() * 3,
      () => this.collectMetrics.execute(),
    );
  }

  runEvents(): Promise<boolean> {
    return this.withLock(VMWARE_KEYS.eventsLock, 120, () =>
      this.collectEvents.execute(),
    );
  }

  private async withLock(
    key: string,
    ttlSeconds: number,
    job: () => Promise<unknown>,
  ): Promise<boolean> {
    const token = randomUUID();
    const acquired = await this.redis.safeSetNxEx(key, ttlSeconds, token);
    if (!acquired) {
      this.logger.debug(`${key} held by another run, skipping`);
      return false;
    }
    try {
      await job();
    } catch (error) {
      this.logger.error(`${key} run failed: ${error?.message}`);
    } finally {
      await this.redis.safeReleaseLock(key, token);
    }
    return true;
  }
}
