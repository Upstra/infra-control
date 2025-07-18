import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  UpsBatteryAlertEvent,
  UpsBatteryEvents,
} from '../../domain/events/ups-battery.events';
import { EmailEvents } from '@/modules/email/domain/events/email.events';

@Injectable()
export class UpsBatteryAlertListener {
  private lastAlertSent: Map<string, Date> = new Map();
  private readonly alertCooldown = 15 * 60 * 1000; // 15 minutes

  constructor(private eventEmitter: EventEmitter2) {}

  @OnEvent(UpsBatteryEvents.BATTERY_ALERT)
  async handleBatteryAlert(event: UpsBatteryAlertEvent): Promise<void> {
    if (!this.shouldSendAlert(event)) {
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

    this.lastAlertSent.set(
      `${event.upsId}-${event.status.alertLevel}`,
      new Date(),
    );
  }

  private shouldSendAlert(event: UpsBatteryAlertEvent): boolean {
    if (event.status.alertLevel === 'low') {
      return false;
    }

    const key = `${event.upsId}-${event.status.alertLevel}`;
    const lastSent = this.lastAlertSent.get(key);

    if (!lastSent) return true;

    return Date.now() - lastSent.getTime() > this.alertCooldown;
  }
}
