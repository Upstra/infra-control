import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { GetUpsBatteryUseCase } from '../use-cases/get-ups-battery.use-case';
import { UpsBatteryEvents } from '../../domain/events/ups-battery.events';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';

@Injectable()
export class UpsBatteryJobService {
  private readonly logger = new Logger(UpsBatteryJobService.name);
  private readonly batchSize: number;
  private readonly delayBetweenBatches: number;
  private isRunning = false;

  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly getUpsBatteryUseCase: GetUpsBatteryUseCase,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.batchSize = this.configService.get<number>('UPS_BATTERY_BATCH_SIZE', 5);
    this.delayBetweenBatches = this.configService.get<number>(
      'UPS_BATTERY_BATCH_DELAY_MS',
      2000,
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAllUpsBatteries() {
    if (this.isRunning) {
      this.logger.warn('Previous battery check job is still running, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting UPS battery status check job');

    try {
      const allUps = await this.upsRepository.findAll();
      const totalUps = allUps.length;
      
      this.logger.log(`Found ${totalUps} UPS devices to check`);

      for (let i = 0; i < totalUps; i += this.batchSize) {
        const batch = allUps.slice(i, i + this.batchSize);
        const batchNumber = Math.floor(i / this.batchSize) + 1;
        const totalBatches = Math.ceil(totalUps / this.batchSize);
        
        this.logger.log(
          `Processing batch ${batchNumber}/${totalBatches} (${batch.length} UPS devices)`,
        );

        const batchResults = await Promise.allSettled(
          batch.map(async (ups) => {
            try {
              const status = await this.getUpsBatteryUseCase.execute(ups.id);
              return { ups, status };
            } catch (error) {
              this.logger.error(
                `Failed to check battery for UPS ${ups.name} (${ups.ip}): ${error.message}`,
              );
              return { ups, error };
            }
          }),
        );

        const successfulChecks = batchResults.filter(
          (result): result is PromiseFulfilledResult<{ ups: any; status: UPSBatteryStatusDto }> =>
            result.status === 'fulfilled' && 'status' in result.value,
        );

        this.eventEmitter.emit(UpsBatteryEvents.BATCH_CHECKED, {
          batchNumber,
          totalBatches,
          successCount: successfulChecks.length,
          totalCount: batch.length,
          results: successfulChecks.map((r) => r.value.status),
        });

        if (i + this.batchSize < totalUps) {
          this.logger.log(
            `Waiting ${this.delayBetweenBatches}ms before next batch...`,
          );
          await this.delay(this.delayBetweenBatches);
        }
      }

      this.logger.log('Completed UPS battery status check job');
    } catch (error) {
      this.logger.error('Failed to complete battery check job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}