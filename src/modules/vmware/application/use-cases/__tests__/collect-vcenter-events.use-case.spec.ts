import { CollectVcenterEventsUseCase } from '../collect-vcenter-events.use-case';
import { PowerOffCauseDomainService } from '../../../domain/services/power-off-cause.domain.service';
import { VmwareTelemetryEvents } from '../../../domain/events/vmware-telemetry.events';
import { createVcenterEvent } from '../../../__mocks__/vmware-telemetry.mock';

describe('CollectVcenterEventsUseCase', () => {
  const python = { executePython: jest.fn() };
  const servers = { findServerByTypeWithCredentials: jest.fn() };
  const connection = {
    buildVmwareConnection: jest.fn(() => ({
      host: 'vc',
      user: 'svc-upstra',
      password: 'secret',
      port: 443,
    })),
    buildConnectionArgs: jest.fn(() => [
      '--ip',
      'vc',
      '--user',
      'svc-upstra',
      '--password',
      'secret',
    ]),
  };
  const cache = {
    getEventsCursor: jest.fn(),
    setEventsCursor: jest.fn(),
    markHaSeen: jest.fn(),
    getHaSeen: jest.fn().mockResolvedValue(null),
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
    { get: jest.fn() } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    servers.findServerByTypeWithCredentials.mockResolvedValue({
      login: 'svc-upstra',
    });
  });

  it('records a manual power off and advances the cursor', async () => {
    cache.getEventsCursor.mockResolvedValue({
      createdAt: '2026-11-04T20:00:00.000Z',
      keys: [1],
    });
    python.executePython.mockResolvedValue({
      until: '2026-11-04T20:07:12.000Z',
      events: [createVcenterEvent()],
    });

    const result = await useCase.execute();

    expect(python.executePython).toHaveBeenCalledWith(
      'vcenter_events.sh',
      expect.arrayContaining([
        '--since',
        '2026-11-04T20:00:00.000Z',
        '--max',
        '500',
      ]),
      expect.anything(),
    );
    expect(cache.setPowerOff).toHaveBeenCalledWith(
      'vm-1042',
      expect.objectContaining({
        cause: 'manual',
        by: 'VSPHERE.LOCAL\\jbidule',
      }),
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      VmwareTelemetryEvents.VM_POWERED_OFF,
      expect.anything(),
    );
    expect(result?.cursor).toEqual({
      createdAt: '2026-11-04T20:05:10.000Z',
      keys: [884213],
    });
  });

  it('ignores events already seen at the cursor', async () => {
    cache.getEventsCursor.mockResolvedValue({
      createdAt: '2026-11-04T20:05:10.000Z',
      keys: [884213],
    });
    python.executePython.mockResolvedValue({
      until: '2026-11-04T20:07:12.000Z',
      events: [createVcenterEvent()],
    });

    const result = await useCase.execute();

    expect(result).toMatchObject({ processed: 0, skipped: 1 });
    expect(cache.setPowerOff).not.toHaveBeenCalled();
  });

  it('upgrades a recorded power off to HA when the HA event arrives later', async () => {
    cache.getEventsCursor.mockResolvedValue(null);
    cache.getPowerOff.mockResolvedValue({
      at: '2026-11-04T20:05:10.000Z',
      cause: 'manual',
      by: 'x',
    });
    python.executePython.mockResolvedValue({
      until: '2026-11-04T20:07:12.000Z',
      events: [
        createVcenterEvent({
          key: 9,
          type: 'com.vmware.vc.ha.VmRestartedByHAEvent',
          createdAt: '2026-11-04T20:05:15.000Z',
        }),
      ],
    });

    await useCase.execute();

    expect(cache.markHaSeen).toHaveBeenCalledWith(
      'vm-1042',
      '2026-11-04T20:05:15.000Z',
    );
    expect(cache.setPowerOff).toHaveBeenCalledWith('vm-1042', {
      at: '2026-11-04T20:05:10.000Z',
      cause: 'ha',
      by: null,
    });
  });
});
