import { Injectable } from '@nestjs/common';
import { UPSBatteryStatusDto } from '../interfaces/ups-battery-status.interface';

@Injectable()
export class UpsBatteryDomainService {
  private readonly thresholds = {
    critical: 5,
    warning: 15,
    low: 30,
  };

  enrichBatteryStatus(
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

  calculateAlertLevel(
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
