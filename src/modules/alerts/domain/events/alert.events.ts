import { Alert } from '../entities/alert.entity';
import { AlertTransition } from '../entities/alert-transition.entity';

export enum AlertEvents {
  TRANSITION = 'alerts.transition',
  SUMMARY_CHANGED = 'alerts.summary.changed',
}

export interface AlertTransitionEvent {
  alert: Alert;
  transition: AlertTransition;
}

export interface AlertSummaryChangedEvent {
  open: { critical: number; warning: number; info: number };
  unacknowledgedCritical: number;
}
