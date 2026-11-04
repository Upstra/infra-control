import { Alert } from '../entities/alert.entity';
import { AlertTransition } from '../entities/alert-transition.entity';

export enum AlertEvents {
  TRANSITION = 'alerts.transition',
}

export interface AlertTransitionEvent {
  alert: Alert;
  transition: AlertTransition;
}
