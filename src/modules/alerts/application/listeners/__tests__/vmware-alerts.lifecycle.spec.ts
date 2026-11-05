import { VmwareAlertsListener } from '../vmware-alerts.listener';
import { AlertSeverity, AlertType } from '../../../domain/types/alert.types';
import {
  createHostTelemetry,
  createVmTelemetry,
} from '@/modules/vmware/__mocks__/vmware-telemetry.mock';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';

describe('VmwareAlertsListener lifecycle', () => {
  const alertService = { raise: jest.fn(), resolve: jest.fn() };
  const cache = { getPowerOff: jest.fn().mockResolvedValue(null) };
  const vms = { findOneByField: jest.fn() };
  const servers = { findAllByField: jest.fn() };
  const config = {
    get: jest.fn((key: string) =>
      key === 'VM_HIGH_PRIORITY_MAX' ? '5' : undefined,
    ),
  };
  const listener = new VmwareAlertsListener(
    alertService as any,
    cache as any,
    vms as any,
    servers as any,
    config as any,
  );
  const metrics = (overrides: object) => ({
    collectedAt: '',
    vms: [],
    hosts: [],
    changedVms: [],
    changedHosts: [],
    upstraPlanActive: false,
    ...overrides,
  });
  const raised = () =>
    alertService.raise.mock.calls.map(([input]) => [
      input.type,
      input.severity,
    ]);

  beforeEach(() => {
    jest.clearAllMocks();
    vms.findOneByField.mockResolvedValue(
      createMockVm({ id: 'vm-uuid', name: 'web-01', priority: 40 }),
    );
    servers.findAllByField.mockResolvedValue([
      { id: 'srv-uuid', name: 'esx-03' },
    ]);
  });

  it('raises heartbeat loss for an unknown VM and a warning power-off for a low priority VM', async () => {
    await listener.handleMetrics(
      metrics({ changedVms: [createVmTelemetry({ health: 'unknown' })] }),
    );
    await listener.handlePoweredOff({
      moid: 'vm-1',
      name: 'web-01',
      hostMoid: null,
      powerOff: { at: 'x', cause: 'ha', by: null },
    });

    expect(raised()).toEqual([
      [AlertType.VM_HEARTBEAT_LOST, AlertSeverity.WARNING],
      [AlertType.VM_POWERED_OFF, AlertSeverity.WARNING],
    ]);
    expect(alertService.raise.mock.calls[1][0].message).toBe(
      'web-01 a été arrêtée par vSphere HA.',
    );
  });

  it('resolves VM alerts when it is back up, on power-on and on an Upstra power-off', async () => {
    await listener.handleMetrics(
      metrics({ changedVms: [createVmTelemetry({ health: 'up' })] }),
    );
    await listener.handlePoweredOn({ moid: 'vm-1', name: 'web-01', at: 'now' });
    await listener.handlePoweredOff({
      moid: 'vm-1',
      name: 'web-01',
      hostMoid: null,
      powerOff: { at: 'x', cause: 'upstra', by: 'svc' },
    });

    expect(alertService.raise).not.toHaveBeenCalled();
    expect(alertService.resolve.mock.calls.map(([key]) => key)).toEqual([
      'vm:vm-uuid:vm_powered_off',
      'vm:vm-uuid:vm_heartbeat_lost',
      'vm:vm-uuid:vm_powered_off',
      'vm:vm-uuid:vm_powered_off',
    ]);
  });

  it('raises host CPU saturation after three readings and ignores hosts and VMs unknown to Upstra', async () => {
    await listener.handleMetrics(
      metrics({
        hosts: [createHostTelemetry({ cpuHighStreak: 3, cpuPercent: 96 })],
      }),
    );
    servers.findAllByField.mockResolvedValue([]);
    vms.findOneByField.mockResolvedValue(null);
    await listener.handleMetrics(
      metrics({
        hosts: [createHostTelemetry()],
        changedVms: [createVmTelemetry({ health: 'down' })],
      }),
    );
    await listener.handlePoweredOn({ moid: 'vm-x', name: null, at: 'now' });

    expect(raised()).toEqual([
      [AlertType.HOST_CPU_HIGH, AlertSeverity.WARNING],
    ]);
  });
});
