import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EmailEvents } from '@/modules/email/domain/events/email.events';
import {
  AlertEvents,
  AlertTransitionEvent,
} from '../../domain/events/alert.events';
import {
  AlertResourceType,
  AlertSeverity,
  AlertTransitionType,
} from '../../domain/types/alert.types';

const NOTIFIED_TRANSITIONS = [
  AlertTransitionType.OPENED,
  AlertTransitionType.ESCALATED,
];

@Injectable()
export class AlertEmailListener {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent(AlertEvents.TRANSITION)
  handleTransition({ alert, transition }: AlertTransitionEvent): void {
    if (
      alert.severity !== AlertSeverity.CRITICAL ||
      alert.resourceType !== AlertResourceType.UPS ||
      !NOTIFIED_TRANSITIONS.includes(transition.type)
    ) {
      return;
    }

    const latest = (alert.details?.latest ?? {}) as Record<string, unknown>;
    this.eventEmitter.emit(EmailEvents.UPS_BATTERY_CRITICAL, {
      upsName: alert.resourceName,
      upsIp: (latest.ip as string) ?? '',
      minutesRemaining: (latest.minutesRemaining as number | null) ?? null,
      alertLevel: 'critical',
      statusLabel: alert.title,
    });
  }
}
