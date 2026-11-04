import { Injectable } from '@nestjs/common';
import {
  UpsAlertLevel,
  UPSBatteryStatusDto,
} from '../interfaces/ups-battery-status.interface';
import { UpsTelemetry } from '../interfaces/ups-telemetry.interface';

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
    minutesRemaining: number | null,
    telemetry: UpsTelemetry | null = null,
    upsName?: string,
  ): UPSBatteryStatusDto {
    const minutes = telemetry
      ? this.minutesFromTelemetry(telemetry)
      : minutesRemaining;
    const onBattery = telemetry?.status.onBattery ?? null;
    const alertLevel = this.calculateAlertLevel(telemetry, minutes);

    return {
      upsId,
      upsName,
      ip,
      minutesRemaining: minutes,
      hoursRemaining:
        minutes === null ? null : Math.round((minutes / 60) * 100) / 100,
      timestamp: new Date(),
      alertLevel,
      statusLabel: this.getStatusLabel(alertLevel, telemetry),
      telemetry,
      onBattery,
      batteryPercentage: telemetry?.battery.chargePercent ?? null,
      loadPercent: telemetry?.load.percent ?? null,
    };
  }

  calculateAlertLevel(
    telemetry: UpsTelemetry | null,
    minutes: number | null,
  ): UpsAlertLevel {
    const status = telemetry?.status;
    if (status?.onBattery === true) {
      if (status.lowBattery || this.isAtMost(minutes, this.thresholds.critical))
        return 'critical';
      if (this.isAtMost(minutes, this.thresholds.warning)) return 'warning';
      return 'low';
    }
    if (status?.onBattery === false) {
      return status.overload || status.replaceBattery ? 'warning' : 'normal';
    }
    return this.calculateLegacyAlertLevel(minutes);
  }

  minutesFromTelemetry(telemetry: UpsTelemetry): number | null {
    const seconds = telemetry.battery.runtimeSeconds;
    return seconds === null ? null : Math.floor(seconds / 60);
  }

  private calculateLegacyAlertLevel(minutes: number | null): UpsAlertLevel {
    if (minutes === null) return 'normal';
    if (minutes <= this.thresholds.critical) return 'critical';
    if (minutes <= this.thresholds.warning) return 'warning';
    if (minutes <= this.thresholds.low) return 'low';
    return 'normal';
  }

  private isAtMost(minutes: number | null, threshold: number): boolean {
    return minutes !== null && minutes <= threshold;
  }

  private getStatusLabel(
    alertLevel: UpsAlertLevel,
    telemetry: UpsTelemetry | null,
  ): string {
    const status = telemetry?.status;
    if (status?.onBattery === true) {
      const labels: Record<UpsAlertLevel, string> = {
        critical: 'Sur batterie - Critique, action immédiate requise',
        warning: 'Sur batterie - Préparer shutdown',
        low: 'Sur batterie',
        normal: 'Sur batterie',
      };
      return labels[alertLevel];
    }
    if (status?.onBattery === false) {
      if (status.overload) return 'Sur secteur - Surcharge';
      if (status.replaceBattery) return 'Sur secteur - Batterie à remplacer';
      return 'Sur secteur';
    }
    const legacyLabels: Record<UpsAlertLevel, string> = {
      critical: 'Critique - Action immédiate requise',
      warning: 'Avertissement - Préparer shutdown',
      low: 'Faible - Surveillance accrue',
      normal: 'Normal',
    };
    return `Statut secteur inconnu - ${legacyLabels[alertLevel]}`;
  }
}
