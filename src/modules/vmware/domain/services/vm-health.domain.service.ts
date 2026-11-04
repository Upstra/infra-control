import { Injectable } from '@nestjs/common';
import {
  InventoryHost,
  InventoryVm,
  VmHealth,
} from '../interfaces/vmware-telemetry.interface';

const DEGRADED_STATUSES = ['yellow', 'red'];
export const VM_CPU_STREAK_FOR_DEGRADED = 2;

export interface HealthResult {
  health: VmHealth;
  cpuHighStreak: number;
}

@Injectable()
export class VmHealthDomainService {
  evaluateVm(
    vm: InventoryVm,
    previousCpuHighStreak: number,
    cpuWarnPercent: number,
  ): HealthResult {
    const cpuHighStreak =
      vm.cpuPercent !== null && vm.cpuPercent > cpuWarnPercent
        ? previousCpuHighStreak + 1
        : 0;

    if (vm.powerState === 'poweredOff' || vm.powerState === 'suspended') {
      return { health: 'down', cpuHighStreak: 0 };
    }
    if (
      vm.connectionState !== 'connected' ||
      (vm.powerState === 'poweredOn' && vm.heartbeat === 'gray')
    ) {
      return { health: 'unknown', cpuHighStreak };
    }
    if (
      this.isDegradedStatus(vm.overallStatus) ||
      this.isDegradedStatus(vm.heartbeat) ||
      cpuHighStreak >= VM_CPU_STREAK_FOR_DEGRADED
    ) {
      return { health: 'degraded', cpuHighStreak };
    }
    return { health: 'up', cpuHighStreak };
  }

  evaluateHost(
    host: InventoryHost,
    previousCpuHighStreak: number,
    cpuWarnPercent: number,
  ): HealthResult {
    const cpuHighStreak =
      host.cpuPercent !== null && host.cpuPercent > cpuWarnPercent
        ? previousCpuHighStreak + 1
        : 0;

    if (
      host.connectionState !== 'connected' ||
      host.powerState !== 'poweredOn'
    ) {
      return { health: 'down', cpuHighStreak };
    }
    if (
      this.isDegradedStatus(host.overallStatus) ||
      host.maintenance === true
    ) {
      return { health: 'degraded', cpuHighStreak };
    }
    return { health: 'up', cpuHighStreak };
  }

  isStale(
    metricsAt: string,
    intervalSeconds: number,
    now = Date.now(),
  ): boolean {
    const collected = new Date(metricsAt).getTime();
    if (Number.isNaN(collected)) return true;
    return now - collected > intervalSeconds * 3 * 1000;
  }

  private isDegradedStatus(status: string | null): boolean {
    return status !== null && DEGRADED_STATUSES.includes(status);
  }
}
