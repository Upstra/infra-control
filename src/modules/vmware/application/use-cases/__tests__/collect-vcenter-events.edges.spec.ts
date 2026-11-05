import { CollectVcenterEventsUseCase } from '../collect-vcenter-events.use-case';
import { PowerOffCauseDomainService } from '../../../domain/services/power-off-cause.domain.service';
import { VmwareTelemetryEvents } from '../../../domain/events/vmware-telemetry.events';
import { createVcenterEvent } from '../../../__mocks__/vmware-telemetry.mock';

describe('CollectVcenterEventsUseCase edge cases', () => {
  const python = { executePython: jest.fn() };
  const servers = { findServerByTypeWithCredentials: jest.fn() };
  const connection = {
    buildVmwareConnection: jest.fn(() => ({})),
    buildConnectionArgs: jest.fn(() => []),
  };
  const cache = {
    getEventsCursor: jest.fn().mockResolvedValue(null),
    setEventsCursor: jest.fn(),
    markHaSeen: jest.fn(),
    getHaSeen: jest.fn(),
    getPowerOff: jest.fn(),
    setPowerOff: jest.fn(),
    clearPowerOff: jest.fn(),
  };
  const plan = { isActive: jest.fn().mockResolvedValue(false) };
  const emitter = { emit: jest.fn() };
  const useCase = new CollectVcenterEventsUseCase(
    python as any,
    servers as any,
    connection as any,
    new PowerOffCauseDomainService(),
    cache as any,
    plan as any,
    emitter as any,
    { get: () => 'svc-upstra' } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    servers.findServerByTypeWithCredentials.mockResolvedValue({
      login: 'admin',
    });
  });

  it('does nothing without vCenter and refuses an invalid script output', async () => {
    servers.findServerByTypeWithCredentials.mockResolvedValueOnce(null);
    await expect(useCase.execute()).resolves.toBeNull();

    python.executePython.mockResolvedValue({ nope: true });
    await expect(useCase.execute()).rejects.toThrow(
      'Invalid vcenter_events output',
    );
  });

  it('clears the power-off on power-on, uses an HA marker seen earlier and starts the cursor at until', async () => {
    cache.getHaSeen.mockResolvedValue('2026-11-04T20:05:12.000Z');
    python.executePython.mockResolvedValue({
      until: '2026-11-04T20:07:00.000Z',
      events: [
        createVcenterEvent({
          key: 1,
          type: 'VmPoweredOnEvent',
          vmMoid: 'vm-2',
        }),
        createVcenterEvent({ key: 2 }),
        createVcenterEvent({ key: 3, type: 'VmMigratedEvent' }),
        createVcenterEvent({ key: 4, vmMoid: null }),
      ],
    });

    await useCase.execute();

    expect(cache.clearPowerOff).toHaveBeenCalledWith('vm-2');
    expect(emitter.emit).toHaveBeenCalledWith(
      VmwareTelemetryEvents.VM_POWERED_ON,
      expect.objectContaining({ moid: 'vm-2' }),
    );
    expect(cache.setPowerOff).toHaveBeenCalledWith(
      'vm-1042',
      expect.objectContaining({ cause: 'ha' }),
    );

    python.executePython.mockResolvedValue({
      until: '2026-11-04T20:08:00.000Z',
      events: [],
    });
    const empty = await useCase.execute();
    expect(empty?.cursor).toEqual({
      createdAt: '2026-11-04T20:08:00.000Z',
      keys: [],
    });
  });

  it('attributes power-offs to Upstra while a plan runs and keeps an HA cause untouched', async () => {
    plan.isActive.mockResolvedValueOnce(true);
    cache.getHaSeen.mockResolvedValue(null);
    cache.getPowerOff.mockResolvedValue({
      at: '2026-11-04T20:05:10.000Z',
      cause: 'ha',
      by: null,
    });
    python.executePython.mockResolvedValue({
      until: 'x',
      events: [
        createVcenterEvent({ key: 7 }),
        createVcenterEvent({
          key: 8,
          vmMoid: 'vm-2',
          type: 'com.vmware.vc.ha.VmRestartedByHAEvent',
        }),
      ],
    });

    await useCase.execute();

    expect(cache.markHaSeen).toHaveBeenCalledWith('vm-2', expect.any(String));
    expect(cache.setPowerOff).toHaveBeenCalledTimes(1);
    expect(cache.setPowerOff).toHaveBeenCalledWith(
      'vm-1042',
      expect.objectContaining({ cause: 'upstra' }),
    );
  });
});
