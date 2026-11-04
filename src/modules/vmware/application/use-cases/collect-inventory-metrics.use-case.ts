import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PythonExecutorService } from '@/core/services/python-executor/python-executor.service';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { VmwareConnectionService } from '../../domain/services/vmware-connection.service';
import { VmHealthDomainService } from '../../domain/services/vm-health.domain.service';
import {
  VmwareMetricsCollectedEvent,
  VmwareTelemetryEvents,
} from '../../domain/events/vmware-telemetry.events';
import {
  HostTelemetry,
  InventorySnapshot,
  VmTelemetry,
} from '../../domain/interfaces/vmware-telemetry.interface';
import { VmwareTelemetryCacheService } from '../services/vmware-telemetry-cache.service';
import { UpstraPlanStatusService } from '../services/upstra-plan-status.service';

const DEFAULT_INTERVAL_SECONDS = 60;
const DEFAULT_CPU_WARN_PERCENT = 90;
const MIN_CACHE_TTL_SECONDS = 600;
const SCRIPT_TIMEOUT_MS = 120_000;

@Injectable()
export class CollectInventoryMetricsUseCase {
  private readonly logger = new Logger(CollectInventoryMetricsUseCase.name);

  constructor(
    private readonly pythonExecutor: PythonExecutorService,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly connectionService: VmwareConnectionService,
    private readonly healthService: VmHealthDomainService,
    private readonly cache: VmwareTelemetryCacheService,
    private readonly planStatus: UpstraPlanStatusService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  intervalSeconds(): number {
    return Number(
      this.configService.get('VMWARE_METRICS_INTERVAL_SECONDS') ??
        DEFAULT_INTERVAL_SECONDS,
    );
  }

  async execute(): Promise<VmwareMetricsCollectedEvent | null> {
    const vcenter =
      await this.serverRepository.findServerByTypeWithCredentials('vcenter');
    if (!vcenter) {
      this.logger.debug('No vCenter configured, skipping metrics collection');
      return null;
    }

    const connection = this.connectionService.buildVmwareConnection(vcenter);
    const snapshot: InventorySnapshot = await this.pythonExecutor.executePython(
      'inventory_metrics.sh',
      this.connectionService.buildConnectionArgs(connection),
      { timeout: SCRIPT_TIMEOUT_MS },
    );
    if (
      !snapshot ||
      !Array.isArray(snapshot.vms) ||
      !Array.isArray(snapshot.hosts)
    ) {
      throw new Error('Invalid inventory_metrics output');
    }

    const [previousVms, previousHosts] = await Promise.all([
      this.cache.getVms(snapshot.vms.map((vm) => vm.moid)),
      this.cache.getHosts(snapshot.hosts.map((host) => host.moid)),
    ]);
    const cpuWarn = Number(
      this.configService.get('VM_CPU_WARN_PERCENT') ?? DEFAULT_CPU_WARN_PERCENT,
    );

    const vms: VmTelemetry[] = snapshot.vms.map((vm) => ({
      ...vm,
      ...this.healthService.evaluateVm(
        vm,
        previousVms[vm.moid]?.cpuHighStreak ?? 0,
        cpuWarn,
      ),
      metricsAt: snapshot.collectedAt,
    }));
    const hosts: HostTelemetry[] = snapshot.hosts.map((host) => ({
      ...host,
      ...this.healthService.evaluateHost(
        host,
        previousHosts[host.moid]?.cpuHighStreak ?? 0,
        cpuWarn,
      ),
      metricsAt: snapshot.collectedAt,
    }));

    await this.cache.saveSnapshot(
      snapshot.collectedAt,
      vms,
      hosts,
      Math.max(this.intervalSeconds() * 10, MIN_CACHE_TTL_SECONDS),
    );

    const event: VmwareMetricsCollectedEvent = {
      collectedAt: snapshot.collectedAt,
      vms,
      hosts,
      changedVms: vms.filter((vm) => this.changed(previousVms[vm.moid], vm)),
      changedHosts: hosts.filter((host) =>
        this.changed(previousHosts[host.moid], host),
      ),
      upstraPlanActive: await this.planStatus.isActive(),
    };
    this.eventEmitter.emit(VmwareTelemetryEvents.METRICS_COLLECTED, event);
    return event;
  }

  private changed(
    previous: { health: string; cpuPercent: number | null } | undefined,
    current: { health: string; cpuPercent: number | null },
  ): boolean {
    if (!previous) return true;
    return (
      previous.health !== current.health ||
      this.round(previous.cpuPercent) !== this.round(current.cpuPercent)
    );
  }

  private round(value: number | null): number | null {
    return value === null ? null : Math.round(value);
  }
}
