import { AlertResourceType, AlertSeverity } from '../types/alert.types';

export interface AlertResourceRef {
  type: AlertResourceType;
  id: string;
  name: string;
}

export interface RaiseAlertInput {
  dedupKey: string;
  type: string;
  severity: AlertSeverity;
  resource: AlertResourceRef;
  title: string;
  message: string;
  details?: Record<string, unknown> | null;
}
