import { EnrichVmsWithMetricsUseCase } from '../enrich-vms-with-metrics.use-case';
import { VmHealthDomainService } from '@/modules/vmware/domain/services/vm-health.domain.service';
import { createMockVmResponseDto } from '@/modules/vms/__mocks__/vms.mock';
import { createVmTelemetry } from '@/modules/vmware/__mocks__/vmware-telemetry.mock';

describe('EnrichVmsWithMetricsUseCase edge cases', () => {
  const cache = {
    getVms: jest.fn(),
    getPowerOffs: jest.fn().mockResolvedValue({}),
  };
  const useCase = new EnrichVmsWithMetricsUseCase(
    cache as any,
    new VmHealthDomainService(),
    { get: () => '30' } as any,
  );

  it('skips VMs without moid and fills metrics defaults for null readings', async () => {
    cache.getVms.mockResolvedValue({
      'vm-a': createVmTelemetry({
        moid: 'vm-a',
        cpuUsageMhz: null,
        memoryUsageMb: null,
        memoryMb: null,
        powerState: null,
        heartbeat: null,
      }),
    });

    const [withoutMoid, vm] = await useCase.execute([
      createMockVmResponseDto({ moid: undefined }),
      createMockVmResponseDto({ moid: 'vm-a' }),
    ]);

    expect(cache.getVms).toHaveBeenCalledWith(['vm-a']);
    expect(withoutMoid).toMatchObject({ health: 'unknown', powerOff: null });
    expect(vm.metrics).toEqual({
      cpuUsage: 0,
      memoryUsage: 0,
      memoryMB: 0,
      powerState: 'unknown',
      guestToolsStatus: 'unknown',
    });
  });

  it('gives no power-off cause to a down VM when none was recorded', async () => {
    cache.getVms.mockResolvedValue({
      'vm-b': createVmTelemetry({ moid: 'vm-b', health: 'down' }),
    });

    const [vm] = await useCase.execute([
      createMockVmResponseDto({ moid: 'vm-b' }),
    ]);

    expect(vm).toMatchObject({ health: 'down', powerOff: null });
  });
});
