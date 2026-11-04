import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VmwareTelemetryCacheService } from '@/modules/vmware/application/services/vmware-telemetry-cache.service';
import { VmHealthDomainService } from '@/modules/vmware/domain/services/vm-health.domain.service';
import {
  PowerOffCause,
  VmHealth,
  VmTelemetry,
} from '@/modules/vmware/domain/interfaces/vmware-telemetry.interface';
import { VmResponseDto, VmMetricsDto } from '../dto';

const DEFAULT_METRICS_INTERVAL_SECONDS = 60;

@Injectable()
export class EnrichVmsWithMetricsUseCase {
  constructor(
    private readonly telemetryCache: VmwareTelemetryCacheService,
    private readonly healthService: VmHealthDomainService,
    private readonly configService: ConfigService,
  ) {}

  async execute(vms: VmResponseDto[]): Promise<VmResponseDto[]> {
    const moids = vms
      .map((vm) => vm.moid)
      .filter((moid): moid is string => !!moid);
    const [telemetry, powerOffs] = await Promise.all([
      this.telemetryCache.getVms(moids),
      this.telemetryCache.getPowerOffs(moids),
    ]);
    const interval = Number(
      this.configService.get('VMWARE_METRICS_INTERVAL_SECONDS') ??
        DEFAULT_METRICS_INTERVAL_SECONDS,
    );

    return vms.map((vm) => {
      const cached = vm.moid ? telemetry[vm.moid] : undefined;
      const health = this.health(cached, interval);
      return {
        ...vm,
        metrics: cached ? this.toMetrics(cached) : undefined,
        health,
        cpuPercent: cached?.cpuPercent ?? null,
        uptimeSeconds: cached?.uptimeSeconds ?? null,
        powerOff:
          health === 'down' && vm.moid
            ? this.toPowerOff(powerOffs[vm.moid])
            : null,
      };
    });
  }

  private health(cached: VmTelemetry | undefined, interval: number): VmHealth {
    if (!cached || this.healthService.isStale(cached.metricsAt, interval)) {
      return 'unknown';
    }
    return cached.health;
  }

  private toMetrics(vm: VmTelemetry): VmMetricsDto {
    return {
      cpuUsage: vm.cpuUsageMhz ?? 0,
      memoryUsage: vm.memoryUsageMb ?? 0,
      memoryMB: vm.memoryMb ?? 0,
      powerState: vm.powerState ?? 'unknown',
      guestToolsStatus: vm.heartbeat ?? 'unknown',
    };
  }

  private toPowerOff(cause: PowerOffCause | undefined): PowerOffCause | null {
    return cause ? { at: cause.at, cause: cause.cause, by: cause.by } : null;
  }
}
