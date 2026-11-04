import {
  UpsAlertLevel,
  UPSBatteryStatusDto,
} from '../interfaces/ups-battery-status.interface';

export enum UpsBatteryEvents {
  BATTERY_ALERT = 'ups.battery.alert',
  BATTERY_CHECKED = 'ups.battery.checked',
  BATCH_CHECKED = 'ups.battery.batch-checked',
  STATUS_CHANGED = 'ups.status.changed',
  CHECK_FAILED = 'ups.battery.check-failed',
  DELETED = 'ups.deleted',
}

export interface UpsBatteryAlertEvent {
  upsId: string;
  upsName: string;
  previousAlertLevel: UpsAlertLevel | null;
  status: {
    ip: string;
    minutesRemaining: number | null;
    alertLevel: Exclude<UpsAlertLevel, 'normal'>;
    statusLabel: string;
    timestamp: Date;
  };
}

export type UpsBatteryCheckedEvent = UPSBatteryStatusDto;

export interface UpsStatusChangedEvent {
  upsId: string;
  upsName: string;
  previous: boolean | null;
  current: boolean;
  at: Date;
  status: UPSBatteryStatusDto;
}

export interface UpsCheckFailedEvent {
  upsId: string;
  upsName: string;
  ip: string;
  error: string;
  at: Date;
}
