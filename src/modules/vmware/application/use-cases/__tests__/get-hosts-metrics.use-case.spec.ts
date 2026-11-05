import { GetHostsMetricsUseCase } from '../get-hosts-metrics.use-case';
import { VmHealthDomainService } from '../../../domain/services/vm-health.domain.service';
import { createHostTelemetry } from '../../../__mocks__/vmware-telemetry.mock';

describe('GetHostsMetricsUseCase', () => {
  const cache = { getHosts: jest.fn() };
  const servers = { findAll: jest.fn() };
  const collect = { intervalSeconds: () => 60 };
  const useCase = new GetHostsMetricsUseCase(
    cache as any,
    servers as any,
    new VmHealthDomainService(),
    collect as any,
  );

  it('links each ESXi host to its server and UPS, sorted by name', async () => {
    cache.getHosts.mockResolvedValue({
      'host-2': createHostTelemetry({ moid: 'host-2', name: 'esx-02' }),
      'host-1': createHostTelemetry({
        moid: 'host-1',
        name: 'esx-01',
        cpuPercent: 71.2,
      }),
    });
    servers.findAll.mockResolvedValue([
      { id: 'srv-1', vmwareHostMoid: 'host-1', upsId: 'ups-1' },
      { id: 'srv-x' },
    ]);

    const hosts = await useCase.execute();

    expect(hosts.map((host) => host.name)).toEqual(['esx-01', 'esx-02']);
    expect(hosts[0]).toMatchObject({
      serverId: 'srv-1',
      upsId: 'ups-1',
      health: 'up',
      cpuPercent: 71.2,
    });
    expect(hosts[1]).toMatchObject({ serverId: null, upsId: null });
  });

  it('reports unknown for a host whose last measure is older than three intervals', async () => {
    cache.getHosts.mockResolvedValue({
      'host-3': createHostTelemetry({
        moid: 'host-3',
        name: null,
        metricsAt: '2020-01-01T00:00:00.000Z',
      }),
    });
    servers.findAll.mockResolvedValue([]);

    const [host] = await useCase.execute();

    expect(host).toMatchObject({ moid: 'host-3', health: 'unknown' });
  });
});
