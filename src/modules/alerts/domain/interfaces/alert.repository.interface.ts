import { Alert } from '../entities/alert.entity';
import {
  AlertResourceType,
  AlertSeverity,
  AlertStatus,
} from '../types/alert.types';

export interface AlertListFilters {
  status?: AlertStatus;
  severity?: AlertSeverity;
  resourceType?: AlertResourceType;
  page: number;
  limit: number;
}

export interface OpenAlertCounts {
  critical: number;
  warning: number;
  info: number;
  unacknowledgedCritical: number;
}

export interface AlertRepositoryInterface {
  findOpenByDedupKey(dedupKey: string): Promise<Alert | null>;
  findById(id: string): Promise<Alert | null>;
  findByIdWithTransitions(id: string): Promise<Alert | null>;
  save(alert: Alert): Promise<Alert>;
  paginate(filters: AlertListFilters): Promise<[Alert[], number]>;
  findOpen(limit?: number): Promise<Alert[]>;
  countOpen(): Promise<OpenAlertCounts>;
}
