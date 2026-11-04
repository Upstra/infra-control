import { UpsTelemetry } from './ups-telemetry.interface';

export type UpsAlertLevel = 'normal' | 'low' | 'warning' | 'critical';

export interface UPSBatteryStatusDto {
  upsId: string;
  upsName?: string;
  ip: string;
  minutesRemaining: number | null;
  hoursRemaining: number | null;
  alertLevel: UpsAlertLevel;
  statusLabel: string;
  timestamp: Date;
  telemetry: UpsTelemetry | null;
  onBattery: boolean | null;
  batteryPercentage: number | null;
  loadPercent: number | null;
}
