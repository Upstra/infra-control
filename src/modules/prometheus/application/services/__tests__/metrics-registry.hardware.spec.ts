import { register } from 'prom-client';
import { MetricsRegistryService } from '../metrics-registry.service';
import { createHostTelemetry } from '@/modules/vmware/__mocks__/vmware-telemetry.mock';
import { createIloHealth } from '@/modules/ilos/__mocks__/ilo-health.mock';
import { createMockBatteryStatus } from '@/modules/ups/__mocks__/ups-telemetry.mock';

describe('MetricsRegistryService hosts and servers', () => {
  let service: MetricsRegistryService;
  const values = async (name: string) =>
    (await register.getSingleMetric(name)!.get()).values;
  const event = (hosts: ReturnType<typeof createHostTelemetry>[]) => ({
    collectedAt: '',
    vms: [],
    hosts,
    changedVms: [],
    changedHosts: [],
    upstraPlanActive: false,
  });

  beforeEach(() => {
    register.clear();
    service = new MetricsRegistryService();
  });

  it('tracks host CPU and memory and drops hosts that disappear from vCenter', async () => {
    service.handleVmwareMetrics(
      event([
        createHostTelemetry({ moid: 'host-1', name: 'esx-01' }),
        createHostTelemetry({ moid: 'host-2', name: null }),
      ]),
    );
    service.handleVmwareMetrics(
      event([
        createHostTelemetry({
          moid: 'host-1',
          name: 'esx-01',
          memoryPercent: null,
        }),
      ]),
    );

    expect(await values('upstra_host_cpu_percent')).toEqual([
      { value: 40, labels: { host_moid: 'host-1', host_name: 'esx-01' } },
    ]);
    expect(await values('upstra_host_memory_percent')).toEqual([]);
  });

  it('tracks server inlet and power, and forgets a deleted server', async () => {
    service.handleIloHealth({
      serverId: 's1',
      serverName: 'srv-b2-03',
      roomId: null,
      room: null,
      health: createIloHealth({ inletC: 31 }),
    });
    expect(await values('upstra_server_inlet_celsius')).toEqual([
      {
        value: 31,
        labels: { server_id: 's1', server_name: 'srv-b2-03', room_id: '' },
      },
    ]);

    service.handleServerDeleted({ serverId: 's1' });
    service.handleServerDeleted({ serverId: 'unknown' });
    expect(await values('upstra_server_power_watts')).toEqual([]);
  });

  it('replaces the series when a UPS is renamed', async () => {
    service.handleUpsChecked(
      createMockBatteryStatus({
        upsId: 'u1',
        upsName: 'UPS-A',
        loadPercent: 40,
        onBattery: true,
      }),
    );
    service.handleUpsChecked(
      createMockBatteryStatus({
        upsId: 'u1',
        upsName: 'UPS-B',
        loadPercent: 42,
        onBattery: null,
      }),
    );

    const load = await values('upstra_ups_load_percent');
    expect(load).toEqual([
      { value: 42, labels: { ups_id: 'u1', ups_name: 'UPS-B', room_id: '' } },
    ]);
    expect(await values('upstra_ups_on_battery')).toEqual([]);
  });
});
