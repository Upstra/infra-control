import { VmwareTelemetryCacheService } from '../vmware-telemetry-cache.service';
import {
  createHostTelemetry,
  createVmTelemetry,
} from '../../../__mocks__/vmware-telemetry.mock';

class Redis {
  store = new Map<string, string>();
  safeGet = jest.fn(async (key: string) => this.store.get(key) ?? null);
  safeSet = jest.fn(
    async (key: string, value: string) => void this.store.set(key, value),
  );
  safeSetEx = jest.fn(
    async (key: string, _ttl: number, value: string) =>
      void this.store.set(key, value),
  );
  safeDel = jest.fn(async (key: string) => void this.store.delete(key));
  safeMGet = jest.fn(async (keys: string[]) =>
    keys.map((key) => this.store.get(key) ?? null),
  );
  safeMSetEx = jest.fn(async (entries: Array<[string, string]>) => {
    entries.forEach(([key, value]) => this.store.set(key, value));
    return true;
  });
}

describe('VmwareTelemetryCacheService', () => {
  let redis: Redis;
  let cache: VmwareTelemetryCacheService;

  beforeEach(() => {
    redis = new Redis();
    cache = new VmwareTelemetryCacheService(redis as any);
  });

  it('writes the whole snapshot in one pipeline and reads it back through the index', async () => {
    await cache.saveSnapshot(
      '2026-11-04T20:07:12.000Z',
      [createVmTelemetry({ moid: 'vm-1' })],
      [createHostTelemetry({ moid: 'host-1' })],
      600,
    );

    expect(redis.safeMSetEx).toHaveBeenCalledTimes(1);
    expect(Object.keys(await cache.getVms())).toEqual(['vm-1']);
    expect(Object.keys(await cache.getHosts())).toEqual(['host-1']);
    expect(await cache.getCollectedAt()).toBe('2026-11-04T20:07:12.000Z');
    expect((await cache.getVm('vm-1'))?.moid).toBe('vm-1');
  });

  it('stores, reads and clears power-off causes, HA markers and the events cursor', async () => {
    await cache.setPowerOff('vm-1', {
      at: 'a',
      cause: 'manual',
      by: 'jbidule',
    });
    await cache.markHaSeen('vm-1', 'b');
    await cache.setEventsCursor({ createdAt: 'c', keys: [1] });

    expect(await cache.getPowerOffs(['vm-1', 'vm-2'])).toEqual({
      'vm-1': { at: 'a', cause: 'manual', by: 'jbidule' },
    });
    expect(await cache.getHaSeen('vm-1')).toBe('b');
    expect(await cache.getEventsCursor()).toEqual({
      createdAt: 'c',
      keys: [1],
    });

    await cache.clearPowerOff('vm-1');
    expect(await cache.getPowerOff('vm-1')).toBeNull();
  });

  it('ignores corrupted entries and empty requests', async () => {
    redis.store.set('vmware:vm:vm-9', '{not json');
    redis.store.set('vmware:inventory:vms', '["vm-9"]');

    expect(await cache.getVms()).toEqual({});
    expect(await cache.getVm('vm-9')).toBeNull();
    expect(await cache.getHosts([])).toEqual({});
    expect(await cache.getEventsCursor()).toBeNull();
  });
});
