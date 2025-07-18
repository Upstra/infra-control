export enum UpsBatteryEvents {
  BATTERY_ALERT = 'ups.battery.alert',
  BATTERY_CHECKED = 'ups.battery.checked',
}

export interface UpsBatteryAlertEvent {
  upsId: string;
  upsName: string;
  status: {
    ip: string;
    minutesRemaining: number;
    alertLevel: 'low' | 'warning' | 'critical';
    statusLabel: string;
    timestamp: Date;
  };
}

export interface UpsBatteryCheckedEvent {
  upsId: string;
  ip: string;
  minutesRemaining: number;
  hoursRemaining: number;
  alertLevel: 'normal' | 'low' | 'warning' | 'critical';
  statusLabel: string;
  timestamp: Date;
}
