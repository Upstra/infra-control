import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AlertEvents } from '../../domain/events/alert.events';
import { GetAlertSummaryUseCase } from '../use-cases/get-alert-summary.use-case';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';

export const ALERT_SUMMARY_CACHE_KEY = 'alerts:summary';

@Injectable()
export class AlertSummaryPublisher implements OnApplicationBootstrap {
  private readonly logger = new Logger(AlertSummaryPublisher.name);

  constructor(
    private readonly getAlertSummaryUseCase: GetAlertSummaryUseCase,
    private readonly eventEmitter: EventEmitter2,
    private readonly redis: RedisSafeService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.publish();
  }

  @OnEvent(AlertEvents.TRANSITION, { async: true })
  async publish(): Promise<void> {
    try {
      const summary = await this.getAlertSummaryUseCase.execute();
      await this.redis.safeSet(
        ALERT_SUMMARY_CACHE_KEY,
        JSON.stringify(summary),
      );
      this.eventEmitter.emit(AlertEvents.SUMMARY_CHANGED, summary);
    } catch (error) {
      this.logger.warn(`Alert summary unavailable: ${error?.message}`);
    }
  }
}
