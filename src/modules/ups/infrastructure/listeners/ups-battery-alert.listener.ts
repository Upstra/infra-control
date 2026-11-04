import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  UpsBatteryAlertEvent,
  UpsBatteryEvents,
} from '../../domain/events/ups-battery.events';
import { EmailEvents } from '@/modules/email/domain/events/email.events';

@Injectable()
export class UpsBatteryAlertListener {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent(UpsBatteryEvents.BATTERY_ALERT)
  handleBatteryAlert(event: UpsBatteryAlertEvent): void {
    if (event.status.alertLevel === 'low') {
      return;
    }

    const emailEvent =
      event.status.alertLevel === 'critical'
        ? EmailEvents.UPS_BATTERY_CRITICAL
        : EmailEvents.UPS_BATTERY_WARNING;

    this.eventEmitter.emit(emailEvent, {
      upsName: event.upsName,
      upsIp: event.status.ip,
      minutesRemaining: event.status.minutesRemaining,
      alertLevel: event.status.alertLevel,
      statusLabel: event.status.statusLabel,
    });
  }
}
