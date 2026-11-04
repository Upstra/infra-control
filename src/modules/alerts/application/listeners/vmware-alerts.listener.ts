import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import {
  VmPoweredOffEvent,
  VmPoweredOnEvent,
  VmwareMetricsCollectedEvent,
  VmwareTelemetryEvents,
} from '@/modules/vmware/domain/events/vmware-telemetry.events';
import {
  HostTelemetry,
  PowerOffCause,
  VmTelemetry,
} from '@/modules/vmware/domain/interfaces/vmware-telemetry.interface';
import { VmwareTelemetryCacheService } from '@/modules/vmware/application/services/vmware-telemetry-cache.service';
import { AlertService } from '../../domain/services/alert.service';
import {
  AlertResourceType,
  AlertSeverity,
  AlertType,
} from '../../domain/types/alert.types';

export const HOST_CPU_STREAK_FOR_ALERT = 3;
const DEFAULT_HIGH_PRIORITY_MAX = 10;

const CAUSE_LABELS: Record<string, string> = {
  ha: 'par vSphere HA',
  upstra: "par le plan d'arrêt Upstra",
  manual: 'manuellement',
};

@Injectable()
export class VmwareAlertsListener {
  private readonly logger = new Logger(VmwareAlertsListener.name);

  constructor(
    private readonly alertService: AlertService,
    private readonly telemetryCache: VmwareTelemetryCacheService,
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly configService: ConfigService,
  ) {}

  static vmKey(vmId: string, type: AlertType): string {
    return `vm:${vmId}:${type}`;
  }

  static hostKey(serverId: string, type: AlertType): string {
    return `server:${serverId}:${type}`;
  }

  @OnEvent(VmwareTelemetryEvents.METRICS_COLLECTED, { async: true })
  async handleMetrics(event: VmwareMetricsCollectedEvent): Promise<void> {
    await this.safely(async () => {
      for (const vm of event.changedVms) {
        await this.handleVm(vm, event.upstraPlanActive);
      }
      for (const host of event.hosts) {
        await this.handleHost(host);
      }
    });
  }

  @OnEvent(VmwareTelemetryEvents.VM_POWERED_OFF, { async: true })
  async handlePoweredOff(event: VmPoweredOffEvent): Promise<void> {
    await this.safely(async () => {
      const vm = await this.findVm(event.moid);
      if (!vm) return;
      if (event.powerOff.cause === 'upstra') {
        await this.alertService.resolve(
          VmwareAlertsListener.vmKey(vm.id, AlertType.VM_POWERED_OFF),
          { powerOff: event.powerOff },
        );
        return;
      }
      await this.raisePoweredOff(vm, event.powerOff);
    });
  }

  @OnEvent(VmwareTelemetryEvents.VM_POWERED_ON, { async: true })
  async handlePoweredOn(event: VmPoweredOnEvent): Promise<void> {
    await this.safely(async () => {
      const vm = await this.findVm(event.moid);
      if (!vm) return;
      await this.alertService.resolve(
        VmwareAlertsListener.vmKey(vm.id, AlertType.VM_POWERED_OFF),
        { poweredOnAt: event.at },
      );
    });
  }

  private async handleVm(
    telemetry: VmTelemetry,
    upstraPlanActive: boolean,
  ): Promise<void> {
    const vm = await this.findVm(telemetry.moid);
    if (!vm) return;
    const poweredOffKey = VmwareAlertsListener.vmKey(
      vm.id,
      AlertType.VM_POWERED_OFF,
    );
    const heartbeatKey = VmwareAlertsListener.vmKey(
      vm.id,
      AlertType.VM_HEARTBEAT_LOST,
    );

    if (telemetry.health === 'down') {
      await this.alertService.resolve(heartbeatKey);
      const powerOff = await this.telemetryCache.getPowerOff(telemetry.moid);
      if (upstraPlanActive || powerOff?.cause === 'upstra') return;
      await this.raisePoweredOff(vm, powerOff, telemetry);
      return;
    }

    await this.alertService.resolve(poweredOffKey, this.vmDetails(telemetry));
    if (telemetry.health === 'unknown') {
      await this.alertService.raise({
        dedupKey: heartbeatKey,
        type: AlertType.VM_HEARTBEAT_LOST,
        severity: AlertSeverity.WARNING,
        resource: { type: AlertResourceType.VM, id: vm.id, name: vm.name },
        title: `${vm.name} ne répond plus`,
        message: `Heartbeat VMware Tools perdu ou VM déconnectée : l'état réel de ${vm.name} est inconnu.`,
        details: this.vmDetails(telemetry),
      });
      return;
    }
    await this.alertService.resolve(heartbeatKey, this.vmDetails(telemetry));
  }

  private async raisePoweredOff(
    vm: Vm,
    powerOff: PowerOffCause | null,
    telemetry?: VmTelemetry,
  ): Promise<void> {
    const highPriority =
      vm.priority <=
      Number(
        this.configService.get('VM_HIGH_PRIORITY_MAX') ??
          DEFAULT_HIGH_PRIORITY_MAX,
      );
    const how = powerOff
      ? `${CAUSE_LABELS[powerOff.cause]}${powerOff.by && powerOff.cause === 'manual' ? ` par ${powerOff.by}` : ''}`
      : 'hors plan Upstra';
    await this.alertService.raise({
      dedupKey: VmwareAlertsListener.vmKey(vm.id, AlertType.VM_POWERED_OFF),
      type: AlertType.VM_POWERED_OFF,
      severity: highPriority ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
      resource: { type: AlertResourceType.VM, id: vm.id, name: vm.name },
      title: `${vm.name} est arrêtée`,
      message: `${vm.name} a été arrêtée ${how}.`,
      details: {
        powerOff,
        priority: vm.priority,
        ...(telemetry ? this.vmDetails(telemetry) : {}),
      },
    });
  }

  private async handleHost(host: HostTelemetry): Promise<void> {
    const server = await this.findServer(host.moid);
    if (!server) return;
    const resource = {
      type: AlertResourceType.SERVER,
      id: server.id,
      name: server.name,
    };
    const disconnectedKey = VmwareAlertsListener.hostKey(
      server.id,
      AlertType.HOST_DISCONNECTED,
    );
    const cpuKey = VmwareAlertsListener.hostKey(
      server.id,
      AlertType.HOST_CPU_HIGH,
    );
    const details = { ...host };

    if (host.connectionState !== 'connected') {
      await this.alertService.raise({
        dedupKey: disconnectedKey,
        type: AlertType.HOST_DISCONNECTED,
        severity: AlertSeverity.CRITICAL,
        resource,
        title: `${server.name} est déconnecté de vCenter`,
        message: `L'hôte ${host.name ?? server.name} ne répond plus à vCenter (${host.connectionState ?? 'état inconnu'}) : ses VMs ne sont plus pilotables.`,
        details,
      });
    } else {
      await this.alertService.resolve(disconnectedKey, details);
    }

    if (host.cpuHighStreak >= HOST_CPU_STREAK_FOR_ALERT) {
      await this.alertService.raise({
        dedupKey: cpuKey,
        type: AlertType.HOST_CPU_HIGH,
        severity: AlertSeverity.WARNING,
        resource,
        title: `${server.name} : CPU saturé`,
        message: `CPU à ${host.cpuPercent ?? '—'} % sur ${host.cpuHighStreak} mesures consécutives.`,
        details,
      });
    } else {
      await this.alertService.resolve(cpuKey, details);
    }
  }

  private vmDetails(telemetry: VmTelemetry): Record<string, unknown> {
    return {
      moid: telemetry.moid,
      hostMoid: telemetry.hostMoid,
      health: telemetry.health,
      powerState: telemetry.powerState,
      heartbeat: telemetry.heartbeat,
      cpuPercent: telemetry.cpuPercent,
      metricsAt: telemetry.metricsAt,
    };
  }

  private findVm(moid: string): Promise<Vm | null> {
    return this.vmRepository.findOneByField({
      field: 'moid',
      value: moid,
      disableThrow: true,
    });
  }

  private async findServer(hostMoid: string): Promise<Server | null> {
    const servers = await this.serverRepository.findAllByField({
      field: 'vmwareHostMoid',
      value: hostMoid,
      disableThrow: true,
    });
    return servers[0] ?? null;
  }

  private async safely(handler: () => Promise<void>): Promise<void> {
    try {
      await handler();
    } catch (error) {
      this.logger.error(`VMware alert handling failed: ${error?.message}`);
    }
  }
}
