export interface UPSBatteryStatusDto {
  upsId: string;
  ip: string;
  minutesRemaining: number;
  hoursRemaining: number;
  alertLevel: 'normal' | 'low' | 'warning' | 'critical';
  statusLabel: string;
  timestamp: Date;
}
