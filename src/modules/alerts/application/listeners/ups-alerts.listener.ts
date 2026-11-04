import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import {
  UpsBatteryEvents,
  UpsCheckFailedEvent,
  UpsStatusChangedEvent,
} from '@/modules/ups/domain/events/ups-battery.events';
import { UPSBatteryStatusDto } from '@/modules/ups/domain/interfaces/ups-battery-status.interface';
import { AlertService } from '../../domain/services/alert.service';
import {
  AlertResourceType,
  AlertSeverity,
  AlertType,
} from '../../domain/types/alert.types';

export const UPS_UNREACHABLE_THRESHOLD = 3;
const FAILURE_COUNTER_TTL_SECONDS = 3600;
const LOW_BATTERY_MINUTES = 5;

const ALERT_SUFFIX: Record<string, string> = {
  [AlertType.UPS_ON_BATTERY]: 'on_battery',
  [AlertType.UPS_LOW_BATTERY]: 'low_battery',
  [AlertType.UPS_UNREACHABLE]: 'unreachable',
  [AlertType.UPS_OVERLOAD]: 'overload',
  [AlertType.UPS_REPLACE_BATTERY]: 'replace_battery',
};

@Injectable()
export class UpsAlertsListener {
  private readonly logger = new Logger(UpsAlertsListener.name);

  constructor(
    private readonly alertService: AlertService,
    private readonly redis: RedisSafeService,
  ) {}

  static dedupKey(upsId: string, type: AlertType): string {
    return `ups:${upsId}:${ALERT_SUFFIX[type]}`;
  }

  @OnEvent(UpsBatteryEvents.STATUS_CHANGED, { async: true })
  async handleStatusChanged(event: UpsStatusChangedEvent): Promise<void> {
    await this.safely(async () => {
      if (event.current) {
        await this.raiseOnBattery(event.upsId, event.upsName, event.status);
        return;
      }
      await this.resolve(event.upsId, AlertType.UPS_ON_BATTERY, event.status);
      await this.resolve(event.upsId, AlertType.UPS_LOW_BATTERY, event.status);
    });
  }

  @OnEvent(UpsBatteryEvents.BATTERY_CHECKED, { async: true })
  async handleBatteryChecked(status: UPSBatteryStatusDto): Promise<void> {
    await this.safely(async () => {
      await this.redis.safeDel(this.failureKey(status.upsId));
      await this.resolve(status.upsId, AlertType.UPS_UNREACHABLE, status);

      const flags = status.telemetry?.status;
      if (!flags) return;
      const name = status.upsName ?? status.ip;

      if (flags.onBattery === true) {
        await this.raiseOnBattery(status.upsId, name, status);
      }

      const lowBattery =
        flags.onBattery === true &&
        (flags.lowBattery === true ||
          (status.minutesRemaining !== null &&
            status.minutesRemaining <= LOW_BATTERY_MINUTES));

      await this.toggle(
        lowBattery,
        status,
        AlertType.UPS_LOW_BATTERY,
        AlertSeverity.CRITICAL,
        `${name} : batterie faible`,
        `Autonomie restante : ${this.runtime(status)}. Les arrêts automatiques sont imminents.`,
      );
      await this.toggle(
        flags.overload === true,
        status,
        AlertType.UPS_OVERLOAD,
        AlertSeverity.WARNING,
        `${name} est en surcharge`,
        `Charge à ${status.loadPercent ?? '—'} % : l'onduleur risque de couper la sortie.`,
      );
      await this.toggle(
        flags.replaceBattery === true,
        status,
        AlertType.UPS_REPLACE_BATTERY,
        AlertSeverity.WARNING,
        `${name} : batterie à remplacer`,
        "L'onduleur signale une batterie usée, l'autonomie annoncée n'est plus fiable.",
      );
    });
  }

  @OnEvent(UpsBatteryEvents.CHECK_FAILED, { async: true })
  async handleCheckFailed(event: UpsCheckFailedEvent): Promise<void> {
    await this.safely(async () => {
      const failures = await this.redis.safeIncr(
        this.failureKey(event.upsId),
        FAILURE_COUNTER_TTL_SECONDS,
      );
      if (failures === null || failures < UPS_UNREACHABLE_THRESHOLD) return;

      await this.alertService.raise({
        dedupKey: UpsAlertsListener.dedupKey(
          event.upsId,
          AlertType.UPS_UNREACHABLE,
        ),
        type: AlertType.UPS_UNREACHABLE,
        severity: AlertSeverity.WARNING,
        resource: this.resource(event.upsId, event.upsName),
        title: `${event.upsName} ne répond plus`,
        message: `Aucune télémétrie depuis ${failures} relevés consécutifs : l'état secteur/batterie est inconnu.`,
        details: { ip: event.ip, error: event.error, failures, at: event.at },
      });
    });
  }

  private async raiseOnBattery(
    upsId: string,
    upsName: string,
    status: UPSBatteryStatusDto,
  ): Promise<void> {
    await this.alertService.raise({
      dedupKey: UpsAlertsListener.dedupKey(upsId, AlertType.UPS_ON_BATTERY),
      type: AlertType.UPS_ON_BATTERY,
      severity: AlertSeverity.CRITICAL,
      resource: this.resource(upsId, upsName),
      title: `${upsName} est sur batterie`,
      message: this.onBatteryMessage(upsName, status),
      details: this.details(status),
    });
  }

  private async toggle(
    active: boolean,
    status: UPSBatteryStatusDto,
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
  ): Promise<void> {
    if (!active) {
      await this.resolve(status.upsId, type, status);
      return;
    }
    await this.alertService.raise({
      dedupKey: UpsAlertsListener.dedupKey(status.upsId, type),
      type,
      severity,
      resource: this.resource(status.upsId, status.upsName ?? status.ip),
      title,
      message,
      details: this.details(status),
    });
  }

  private async resolve(
    upsId: string,
    type: AlertType,
    status: UPSBatteryStatusDto,
  ): Promise<void> {
    await this.alertService.resolve(
      UpsAlertsListener.dedupKey(upsId, type),
      this.details(status),
    );
  }

  private resource(id: string, name: string) {
    return { type: AlertResourceType.UPS, id, name };
  }

  private details(status: UPSBatteryStatusDto): Record<string, unknown> {
    return {
      ip: status.ip,
      minutesRemaining: status.minutesRemaining,
      alertLevel: status.alertLevel,
      statusLabel: status.statusLabel,
      batteryPercentage: status.batteryPercentage,
      loadPercent: status.loadPercent,
      telemetry: status.telemetry,
      at: status.timestamp,
    };
  }

  private onBatteryMessage(name: string, status: UPSBatteryStatusDto): string {
    return `Coupure secteur : les serveurs alimentés par ${name} tournent sur batterie (${this.runtime(status)} d'autonomie).`;
  }

  private runtime(status: UPSBatteryStatusDto): string {
    return status.minutesRemaining === null
      ? 'autonomie inconnue'
      : `${status.minutesRemaining} min`;
  }

  private failureKey(upsId: string): string {
    return `alerts:ups:failures:${upsId}`;
  }

  private async safely(handler: () => Promise<void>): Promise<void> {
    try {
      await handler();
    } catch (error) {
      this.logger.error(`UPS alert handling failed: ${error?.message}`);
    }
  }
}
