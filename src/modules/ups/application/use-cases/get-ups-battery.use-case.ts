import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PythonExecutorService } from '@core/services/python-executor';
import { UpsRepository } from '../../domain/interfaces/ups.repository';
import { UpsBatteryEvents } from '../../domain/events/ups-battery.events';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';
import { UpsNotFoundException } from '../../domain/exceptions/ups.exception';
import { UpsBatteryDomainService } from '../../domain/services/ups-battery.domain.service';

@Injectable()
export class GetUpsBatteryUseCase {
  constructor(
    private pythonExecutor: PythonExecutorService,
    private eventEmitter: EventEmitter2,
    private upsRepository: UpsRepository,
    private upsBatteryDomainService: UpsBatteryDomainService,
  ) {}

  async execute(upsId: string): Promise<UPSBatteryStatusDto> {
    const ups = await this.upsRepository.findById(upsId);
    if (!ups) {
      throw new UpsNotFoundException(upsId);
    }

    const result = await this.pythonExecutor.execute('ups_battery.sh', [
      '--ip',
      ups.ip,
    ]);

    if (result.status === 'success') {
      const minutesRemaining = parseInt(result.output.trim(), 10);
      
      if (isNaN(minutesRemaining)) {
        throw new BadRequestException('Invalid battery minutes value');
      }

      const status = this.upsBatteryDomainService.enrichBatteryStatus(ups.id, ups.ip, minutesRemaining);

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
    }

    throw new BadRequestException(result.message || 'Failed to get battery status');
  }
}