import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  IloHealthCheckedEvent,
  IloHealthEvents,
  IloHealthUnreachableEvent,
} from '@/modules/ilos/domain/events/ilo-health.events';
import { IloHealthDomainService } from '@/modules/ilos/domain/services/ilo-health.domain.service';
import { IloHealth } from '@/modules/ilos/domain/interfaces/ilo-health.interface';
import { AlertService } from '../../domain/services/alert.service';
import {
  AlertResourceType,
  AlertSeverity,
  AlertType,
} from '../../domain/types/alert.types';

const SYSTEM_HEALTH_SEVERITY: Record<string, AlertSeverity> = {
  Warning: AlertSeverity.WARNING,
  Critical: AlertSeverity.CRITICAL,
};

@Injectable()
export class IloAlertsListener {
  private readonly logger = new Logger(IloAlertsListener.name);

  constructor(
    private readonly alertService: AlertService,
    private readonly healthService: IloHealthDomainService,
  ) {}

  static dedupKey(serverId: string, type: AlertType): string {
    return `server:${serverId}:${type}`;
  }

  @OnEvent(IloHealthEvents.CHECKED, { async: true })
  async handleChecked(event: IloHealthCheckedEvent): Promise<void> {
    await this.safely(async () => {
      await this.alertService.resolve(
        IloAlertsListener.dedupKey(
          event.serverId,
          AlertType.SERVER_ILO_UNREACHABLE,
        ),
      );
      await this.handleInlet(event);
      await this.handlePsu(event);
      await this.handleSystemHealth(event);
    });
  }

  @OnEvent(IloHealthEvents.UNREACHABLE, { async: true })
  async handleUnreachable(event: IloHealthUnreachableEvent): Promise<void> {
    await this.safely(() =>
      this.alertService
        .raise({
          dedupKey: IloAlertsListener.dedupKey(
            event.serverId,
            AlertType.SERVER_ILO_UNREACHABLE,
          ),
          type: AlertType.SERVER_ILO_UNREACHABLE,
          severity: AlertSeverity.INFO,
          resource: this.resource(event.serverId, event.serverName),
          title: `iLO de ${event.serverName} injoignable`,
          message: `${event.failures} relevés Redfish consécutifs en échec : températures et alimentations de ${event.serverName} ne sont plus suivies.`,
          details: {
            iloIp: event.iloIp,
            failures: event.failures,
            error: event.error,
          },
        })
        .then(() => undefined),
    );
  }

  private async handleInlet(event: IloHealthCheckedEvent): Promise<void> {
    const key = IloAlertsListener.dedupKey(
      event.serverId,
      AlertType.SERVER_INLET_TEMPERATURE_HIGH,
    );
    const level = this.healthService.inletLevel(event.health, event.room);
    const thresholds = this.healthService.inletThresholds(
      event.health,
      event.room,
    );
    const details = {
      inletC: event.health.thermal.inletC,
      thresholds,
      collectedAt: event.health.collectedAt,
    };

    if (level === 'normal') {
      if (this.healthService.inletBackToNormal(event.health, event.room)) {
        await this.alertService.resolve(key, details);
      }
      return;
    }
    await this.alertService.raise({
      dedupKey: key,
      type: AlertType.SERVER_INLET_TEMPERATURE_HIGH,
      severity:
        level === 'critical' ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
      resource: this.resource(event.serverId, event.serverName),
      title: `${event.serverName} : entrée d'air à ${event.health.thermal.inletC} °C`,
      message: `Seuil ${level === 'critical' ? 'critique' : "d'alerte"} dépassé (${level === 'critical' ? thresholds.critC : thresholds.warnC} °C) : vérifier la climatisation de la baie.`,
      details,
    });
  }

  private async handlePsu(event: IloHealthCheckedEvent): Promise<void> {
    const key = IloAlertsListener.dedupKey(
      event.serverId,
      AlertType.SERVER_PSU_DEGRADED,
    );
    const supplies = event.health.power.supplies;
    if (!this.healthService.psuDegraded(event.health)) {
      await this.alertService.resolve(key, { supplies });
      return;
    }
    const failing = supplies
      .filter((supply) => supply.state === 'Absent' || supply.health !== 'OK')
      .map(
        (supply) =>
          `${supply.name} ${supply.state === 'Absent' ? 'absente' : supply.health}`,
      );
    await this.alertService.raise({
      dedupKey: key,
      type: AlertType.SERVER_PSU_DEGRADED,
      severity: AlertSeverity.WARNING,
      resource: this.resource(event.serverId, event.serverName),
      title: `${event.serverName} : redondance électrique perdue`,
      message: `${failing.join(', ')} : le serveur tourne sur une seule alimentation.`,
      details: { supplies },
    });
  }

  private async handleSystemHealth(
    event: IloHealthCheckedEvent,
  ): Promise<void> {
    const key = IloAlertsListener.dedupKey(
      event.serverId,
      AlertType.SERVER_HEALTH_DEGRADED,
    );
    const health = event.health.system.health;
    const severity = health ? SYSTEM_HEALTH_SEVERITY[health] : undefined;
    if (!severity) {
      await this.alertService.resolve(key, this.systemDetails(event.health));
      return;
    }
    await this.alertService.raise({
      dedupKey: key,
      type: AlertType.SERVER_HEALTH_DEGRADED,
      severity,
      resource: this.resource(event.serverId, event.serverName),
      title: `${event.serverName} : santé matérielle ${health}`,
      message: `L'iLO signale un état ${health} sur ${event.serverName} (${event.health.system.model ?? 'modèle inconnu'}).`,
      details: this.systemDetails(event.health),
    });
  }

  private systemDetails(health: IloHealth): Record<string, unknown> {
    return {
      system: health.system,
      generation: health.generation,
      collectedAt: health.collectedAt,
    };
  }

  private resource(id: string, name: string) {
    return { type: AlertResourceType.SERVER, id, name };
  }

  private async safely(handler: () => Promise<void>): Promise<void> {
    try {
      await handler();
    } catch (error) {
      this.logger.error(`iLO alert handling failed: ${error?.message}`);
    }
  }
}
