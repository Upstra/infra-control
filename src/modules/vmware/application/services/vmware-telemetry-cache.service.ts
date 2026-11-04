import { Injectable } from '@nestjs/common';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import {
  HostTelemetry,
  PowerOffCause,
  VcenterEventsCursor,
  VmTelemetry,
} from '../../domain/interfaces/vmware-telemetry.interface';

export const VMWARE_KEYS = {
  vm: (moid: string) => `vmware:vm:${moid}`,
  host: (moid: string) => `vmware:host:${moid}`,
  vmIndex: 'vmware:inventory:vms',
  hostIndex: 'vmware:inventory:hosts',
  collectedAt: 'vmware:metrics:collectedAt',
  powerOff: (moid: string) => `vm:poweroff:${moid}`,
  haSeen: (moid: string) => `vmware:ha:${moid}`,
  eventsCursor: 'vmware:events:cursor',
  metricsLock: 'vmware:metrics:lock',
  eventsLock: 'vmware:events:lock',
};

const POWER_OFF_TTL_SECONDS = 30 * 24 * 3600;
const HA_SEEN_TTL_SECONDS = 600;

@Injectable()
export class VmwareTelemetryCacheService {
  constructor(private readonly redis: RedisSafeService) {}

  async saveSnapshot(
    collectedAt: string,
    vms: VmTelemetry[],
    hosts: HostTelemetry[],
    ttlSeconds: number,
  ): Promise<void> {
    const entries: Array<[string, string]> = [
      ...vms.map((vm): [string, string] => [
        VMWARE_KEYS.vm(vm.moid),
        JSON.stringify(vm),
      ]),
      ...hosts.map((host): [string, string] => [
        VMWARE_KEYS.host(host.moid),
        JSON.stringify(host),
      ]),
      [VMWARE_KEYS.vmIndex, JSON.stringify(vms.map((vm) => vm.moid))],
      [VMWARE_KEYS.hostIndex, JSON.stringify(hosts.map((host) => host.moid))],
      [VMWARE_KEYS.collectedAt, collectedAt],
    ];
    await this.redis.safeMSetEx(entries, ttlSeconds);
  }

  async getCollectedAt(): Promise<string | null> {
    return this.redis.safeGet(VMWARE_KEYS.collectedAt);
  }

  async getVms(moids?: string[]): Promise<Record<string, VmTelemetry>> {
    const ids = moids ?? (await this.readIndex(VMWARE_KEYS.vmIndex));
    return this.readMany<VmTelemetry>(ids, VMWARE_KEYS.vm);
  }

  async getHosts(moids?: string[]): Promise<Record<string, HostTelemetry>> {
    const ids = moids ?? (await this.readIndex(VMWARE_KEYS.hostIndex));
    return this.readMany<HostTelemetry>(ids, VMWARE_KEYS.host);
  }

  async getVm(moid: string): Promise<VmTelemetry | null> {
    return this.parse<VmTelemetry>(
      await this.redis.safeGet(VMWARE_KEYS.vm(moid)),
    );
  }

  async setPowerOff(moid: string, cause: PowerOffCause): Promise<void> {
    await this.redis.safeSetEx(
      VMWARE_KEYS.powerOff(moid),
      POWER_OFF_TTL_SECONDS,
      JSON.stringify(cause),
    );
  }

  async getPowerOff(moid: string): Promise<PowerOffCause | null> {
    return this.parse<PowerOffCause>(
      await this.redis.safeGet(VMWARE_KEYS.powerOff(moid)),
    );
  }

  async getPowerOffs(moids: string[]): Promise<Record<string, PowerOffCause>> {
    return this.readMany<PowerOffCause>(moids, VMWARE_KEYS.powerOff);
  }

  async clearPowerOff(moid: string): Promise<void> {
    await this.redis.safeDel(VMWARE_KEYS.powerOff(moid));
  }

  async markHaSeen(moid: string, at: string): Promise<void> {
    await this.redis.safeSetEx(
      VMWARE_KEYS.haSeen(moid),
      HA_SEEN_TTL_SECONDS,
      at,
    );
  }

  async getHaSeen(moid: string): Promise<string | null> {
    return this.redis.safeGet(VMWARE_KEYS.haSeen(moid));
  }

  async getEventsCursor(): Promise<VcenterEventsCursor | null> {
    return this.parse<VcenterEventsCursor>(
      await this.redis.safeGet(VMWARE_KEYS.eventsCursor),
    );
  }

  async setEventsCursor(cursor: VcenterEventsCursor): Promise<void> {
    await this.redis.safeSet(VMWARE_KEYS.eventsCursor, JSON.stringify(cursor));
  }

  private async readIndex(key: string): Promise<string[]> {
    return this.parse<string[]>(await this.redis.safeGet(key)) ?? [];
  }

  private async readMany<T>(
    ids: string[],
    keyOf: (id: string) => string,
  ): Promise<Record<string, T>> {
    if (ids.length === 0) return {};
    const values = await this.redis.safeMGet(ids.map(keyOf));
    const result: Record<string, T> = {};
    ids.forEach((id, index) => {
      const parsed = this.parse<T>(values[index] ?? null);
      if (parsed) result[id] = parsed;
    });
    return result;
  }

  private parse<T>(value: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
}
