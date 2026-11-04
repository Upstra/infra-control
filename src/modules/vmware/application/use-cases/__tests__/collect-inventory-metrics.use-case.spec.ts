import { CollectInventoryMetricsUseCase } from '../collect-inventory-metrics.use-case';
import { VmHealthDomainService } from '../../../domain/services/vm-health.domain.service';
import { VmwareTelemetryEvents } from '../../../domain/events/vmware-telemetry.events';
import {
  createInventoryHost,
  createInventoryVm,
  createVmTelemetry,
} from '../../../__mocks__/vmware-telemetry.mock';

describe('CollectInventoryMetricsUseCase', () => {
  const python = { executePython: jest.fn() };
  const servers = { findServerByTypeWithCredentials: jest.fn() };
  const connection = {
    buildVmwareConnection: jest.fn(() => ({})),
    buildConnectionArgs: jest.fn(() => ['--ip', 'vc']),
  };
  const cache = {
    getVms: jest.fn(),
    getHosts: jest.fn(),
    saveSnapshot: jest.fn(),
  };
  const plan = { isActive: jest.fn().mockResolvedValue(false) };
  const emitter = { emit: jest.fn() };
  const useCase = new CollectInventoryMetricsUseCase(
    python as any,
    servers as any,
    connection as any,
    new VmHealthDomainService(),
    cache as any,
    plan as any,
    emitter as any,
    { get: jest.fn() } as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('stores the snapshot in one call and only reports VMs whose state changed', async () => {
    servers.findServerByTypeWithCredentials.mockResolvedValue({});
    python.executePython.mockResolvedValue({
      collectedAt: '2026-11-04T20:07:12.000Z',
      vms: [
        createInventoryVm(),
        createInventoryVm({
          moid: 'vm-2',
          powerState: 'poweredOff',
          cpuPercent: null,
        }),
      ],
      hosts: [createInventoryHost()],
    });
    cache.getVms.mockResolvedValue({
      'vm-1042': createVmTelemetry(),
      'vm-2': createVmTelemetry({ moid: 'vm-2' }),
    });
    cache.getHosts.mockResolvedValue({});

    const event = await useCase.execute();

    expect(python.executePython).toHaveBeenCalledTimes(1);
    expect(cache.saveSnapshot).toHaveBeenCalledWith(
      '2026-11-04T20:07:12.000Z',
      expect.any(Array),
      expect.any(Array),
      600,
    );
    expect(event?.changedVms.map((vm) => vm.moid)).toEqual(['vm-2']);
    expect(event?.changedVms[0].health).toBe('down');
    expect(emitter.emit).toHaveBeenCalledWith(
      VmwareTelemetryEvents.METRICS_COLLECTED,
      event,
    );
  });

  it('does nothing without a vCenter', async () => {
    servers.findServerByTypeWithCredentials.mockResolvedValue(null);

    await expect(useCase.execute()).resolves.toBeNull();
    expect(python.executePython).not.toHaveBeenCalled();
  });
});
