import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PythonExecutorService } from '@core/services/python-executor';
import { UpsRepository } from '../../domain/interfaces/ups.repository';
import { UpsBatteryEvents } from '../../domain/events/ups-battery.events';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';

@Injectable()
export class GetUpsBatteryUseCase {
  private readonly thresholds = {
    critical: 10,
    warning: 30,
    low: 60,
  };

  constructor(
    private pythonExecutor: PythonExecutorService,
    private eventEmitter: EventEmitter2,
    private upsRepository: UpsRepository,
  ) {}

  async execute(upsId: string): Promise<UPSBatteryStatusDto> {
    const ups = await this.upsRepository.findById(upsId);
    if (!ups) {
      throw new Error('UPS not found');
    }

    const result = await this.pythonExecutor.execute('ups_battery.sh', [
      '--ip',
      ups.ip,
    ]);

    if (result.status === 'success') {
      const minutesRemaining = parseInt(result.output.trim(), 10);
      
      if (isNaN(minutesRemaining)) {
        throw new Error('Invalid battery minutes value');
      }

      const status = this.enrichBatteryStatus(ups.id, ups.ip, minutesRemaining);

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

    throw new Error(result.message || 'Failed to get battery status');
  }

  private enrichBatteryStatus(
    upsId: string,
    ip: string,
    minutesRemaining: number,
  ): UPSBatteryStatusDto {
    const alertLevel = this.calculateAlertLevel(minutesRemaining);
    
    return {
      upsId,
      ip,
      minutesRemaining,
      hoursRemaining: Math.round((minutesRemaining / 60) * 100) / 100,
      timestamp: new Date(),
      alertLevel,
      statusLabel: this.getStatusLabel(alertLevel),
    };
  }

  private calculateAlertLevel(
    minutes: number,
  ): 'normal' | 'low' | 'warning' | 'critical' {
    if (minutes <= this.thresholds.critical) return 'critical';
    if (minutes <= this.thresholds.warning) return 'warning';
    if (minutes <= this.thresholds.low) return 'low';
    return 'normal';
  }

  private getStatusLabel(alertLevel: string): string {
    const labels = {
      critical: 'Critique - Action immédiate requise',
      warning: 'Avertissement - Préparer shutdown',
      low: 'Faible - Surveillance accrue',
      normal: 'Normal',
    };
    return labels[alertLevel] || 'Inconnu';
  }
}