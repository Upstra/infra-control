import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CheckAllUpsBatteriesUseCase } from '../use-cases/check-all-ups-batteries.use-case';

export const UPS_POLL_CRON_JOB = 'ups-poll';
export const UPS_POLL_ON_BATTERY_INTERVAL = 'ups-poll-on-battery';
const DEFAULT_POLL_CRON = '*/1 * * * *';
const DEFAULT_ON_BATTERY_SECONDS = 15;

@Injectable()
export class UpsPollScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(UpsPollScheduler.name);
  private running = false;

  constructor(
    private readonly checkAllUpsBatteries: CheckAllUpsBatteriesUseCase,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    const cronExpression =
      this.configService.get<string>('UPS_POLL_CRON') || DEFAULT_POLL_CRON;
    const job = CronJob.from({
      cronTime: cronExpression,
      onTick: () => this.poll(),
    });
    this.schedulerRegistry.addCronJob(UPS_POLL_CRON_JOB, job);
    job.start();
  }

  onModuleDestroy(): void {
    this.stopFastPolling();
    if (this.schedulerRegistry.doesExist('cron', UPS_POLL_CRON_JOB)) {
      this.schedulerRegistry.deleteCronJob(UPS_POLL_CRON_JOB);
    }
  }

  async poll(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.checkAllUpsBatteries.execute();
      if (result.onBattery > 0) {
        this.startFastPolling();
      } else {
        this.stopFastPolling();
      }
    } catch (error) {
      this.logger.error(`UPS polling failed: ${error?.message}`);
    } finally {
      this.running = false;
    }
  }

  isFastPolling(): boolean {
    return this.schedulerRegistry.doesExist(
      'interval',
      UPS_POLL_ON_BATTERY_INTERVAL,
    );
  }

  private startFastPolling(): void {
    if (this.isFastPolling()) return;
    const seconds = Number(
      this.configService.get('UPS_POLL_ON_BATTERY_SECONDS') ??
        DEFAULT_ON_BATTERY_SECONDS,
    );
    const interval = setInterval(() => this.poll(), seconds * 1000);
    this.schedulerRegistry.addInterval(UPS_POLL_ON_BATTERY_INTERVAL, interval);
    this.logger.log(`UPS on battery: polling every ${seconds}s`);
  }

  private stopFastPolling(): void {
    if (!this.isFastPolling()) return;
    this.schedulerRegistry.deleteInterval(UPS_POLL_ON_BATTERY_INTERVAL);
    this.logger.log('All UPS back on mains: normal polling restored');
  }
}
