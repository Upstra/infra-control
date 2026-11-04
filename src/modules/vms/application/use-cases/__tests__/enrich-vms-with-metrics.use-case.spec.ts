import { EnrichVmsWithMetricsUseCase } from '../enrich-vms-with-metrics.use-case';
import { VmHealthDomainService } from '@/modules/vmware/domain/services/vm-health.domain.service';
import { createMockVmResponseDto } from '@/modules/vms/__mocks__/vms.mock';
import { createVmTelemetry } from '@/modules/vmware/__mocks__/vmware-telemetry.mock';

describe('EnrichVmsWithMetricsUseCase', () => {
  const cache = { getVms: jest.fn(), getPowerOffs: jest.fn() };
  const useCase = new EnrichVmsWithMetricsUseCase(
    cache as any,
    new VmHealthDomainService(),
    { get: jest.fn() } as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('reads every VM from the telemetry cache in one batch', async () => {
    cache.getVms.mockResolvedValue({
      'vm-a': createVmTelemetry({ moid: 'vm-a', cpuPercent: 42.5 }),
    });
    cache.getPowerOffs.mockResolvedValue({});

    const [vm] = await useCase.execute([
      createMockVmResponseDto({ moid: 'vm-a' }),
    ]);

    expect(cache.getVms).toHaveBeenCalledWith(['vm-a']);
    expect(vm).toMatchObject({
      health: 'up',
      cpuPercent: 42.5,
      powerOff: null,
    });
    expect(vm.metrics?.powerState).toBe('poweredOn');
  });

  it('exposes the power off cause of a down VM', async () => {
    cache.getVms.mockResolvedValue({
      'vm-b': createVmTelemetry({
        moid: 'vm-b',
        health: 'down',
        powerState: 'poweredOff',
      }),
    });
    cache.getPowerOffs.mockResolvedValue({
      'vm-b': { at: '2026-11-04T20:05:10.000Z', cause: 'ha', by: null },
    });

    const [vm] = await useCase.execute([
      createMockVmResponseDto({ moid: 'vm-b' }),
    ]);

    expect(vm.powerOff).toEqual({
      at: '2026-11-04T20:05:10.000Z',
      cause: 'ha',
      by: null,
    });
  });

  it('reports unknown without metrics when the cache is empty or stale', async () => {
    cache.getVms.mockResolvedValue({
      'vm-c': createVmTelemetry({
        moid: 'vm-c',
        metricsAt: '2020-01-01T00:00:00.000Z',
      }),
    });
    cache.getPowerOffs.mockResolvedValue({});

    const [stale, missing] = await useCase.execute([
      createMockVmResponseDto({ moid: 'vm-c' }),
      createMockVmResponseDto({ id: 'vm-d', moid: 'vm-d' }),
    ]);

    expect(stale.health).toBe('unknown');
    expect(missing).toMatchObject({
      health: 'unknown',
      cpuPercent: null,
      metrics: undefined,
    });
  });
});
