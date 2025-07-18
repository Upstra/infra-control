import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PythonExecutorService } from '@/core/services/python-executor/python-executor.service';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsBatteryEvents } from '../../domain/events/ups-battery.events';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';
import { UpsNotFoundException } from '../../domain/exceptions/ups.exception';
import { UpsBatteryDomainService } from '../../domain/services/ups-battery.domain.service';
import { UpsBatteryCacheService } from '../services/ups-battery-cache.service';

@Injectable()
export class GetUpsBatteryUseCase {
  constructor(
    private pythonExecutor: PythonExecutorService,
    private eventEmitter: EventEmitter2,
    @Inject('UpsRepositoryInterface')
    private upsRepository: UpsRepositoryInterface,
    private upsBatteryDomainService: UpsBatteryDomainService,
    private upsBatteryCacheService: UpsBatteryCacheService,
  ) {}

  async execute(upsId: string): Promise<UPSBatteryStatusDto> {
    const cachedStatus = await this.upsBatteryCacheService.get(upsId);
    if (cachedStatus) {
      return cachedStatus;
    }

    const ups = await this.upsRepository.findUpsById(upsId);
    if (!ups) {
      throw new UpsNotFoundException(upsId);
    }

    try {
      const result = await this.pythonExecutor.executePython('ups_battery.sh', [
        '--ip',
        ups.ip,
      ]);

      let minutesRemaining: number;

      if (typeof result === 'object' && result.status === 'success') {
        minutesRemaining = parseInt(result.output.trim(), 10);
      } else if (typeof result === 'string') {
        minutesRemaining = parseInt(result.trim(), 10);
      } else if (typeof result === 'number') {
        minutesRemaining = result;
      } else {
        throw new BadRequestException(
          'Invalid response format from battery script',
        );
      }

      if (isNaN(minutesRemaining)) {
        throw new BadRequestException('Invalid battery minutes value');
      }

      const status = this.upsBatteryDomainService.enrichBatteryStatus(
        ups.id,
        ups.ip,
        minutesRemaining,
      );

      if (status.alertLevel !== 'normal') {
        this.eventEmitter.emit(UpsBatteryEvents.BATTERY_ALERT, {
          upsId: ups.id,
          upsName: ups.name,
          status: {
            ip: ups.ip,
            minutesRemaining: status.minutesRemaining,
            alertLevel: status.alertLevel as 'low' | 'warning' | 'critical',
            statusLabel: status.statusLabel,
            timestamp: status.timestamp,
          },
        });
      }

      this.eventEmitter.emit(UpsBatteryEvents.BATTERY_CHECKED, status);

      return status;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to get battery status',
      );
    }
  }
}
