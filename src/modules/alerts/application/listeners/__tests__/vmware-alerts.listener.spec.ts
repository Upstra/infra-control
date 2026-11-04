import { VmwareAlertsListener } from '../vmware-alerts.listener';
import { AlertSeverity, AlertType } from '../../../domain/types/alert.types';
import {
  createHostTelemetry,
  createVmTelemetry,
} from '@/modules/vmware/__mocks__/vmware-telemetry.mock';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';

describe('VmwareAlertsListener', () => {
  const alertService = { raise: jest.fn(), resolve: jest.fn() };
  const cache = { getPowerOff: jest.fn() };
  const vms = { findOneByField: jest.fn() };
  const servers = { findAllByField: jest.fn().mockResolvedValue([]) };
  const listener = new VmwareAlertsListener(
    alertService as any,
    cache as any,
    vms as any,
    servers as any,
    { get: jest.fn() } as any,
  );
  const event = (overrides = {}) => ({
    collectedAt: '2026-11-04T20:07:12.000Z',
    vms: [],
    hosts: [],
    changedVms: [
      createVmTelemetry({ health: 'down', powerState: 'poweredOff' }),
    ],
    changedHosts: [],
    upstraPlanActive: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    vms.findOneByField.mockResolvedValue(
      createMockVm({ id: 'vm-uuid', name: 'db-pg-02', priority: 1 }),
    );
  });

  it('opens a critical vm_powered_off alert for a high priority VM stopped manually', async () => {
    cache.getPowerOff.mockResolvedValue({
      at: '2026-11-04T20:05:10.000Z',
      cause: 'manual',
      by: 'jbidule',
    });

    await listener.handleMetrics(event());

    expect(alertService.raise).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupKey: 'vm:vm-uuid:vm_powered_off',
        severity: AlertSeverity.CRITICAL,
        message: 'db-pg-02 a été arrêtée manuellement par jbidule.',
      }),
    );
  });

  it('stays silent while the Upstra plan is shutting VMs down', async () => {
    cache.getPowerOff.mockResolvedValue(null);

    await listener.handleMetrics(event({ upstraPlanActive: true }));

    expect(alertService.raise).not.toHaveBeenCalled();
  });

  it('raises host_disconnected for a host that lost vCenter', async () => {
    servers.findAllByField.mockResolvedValueOnce([
      { id: 'srv-uuid', name: 'srv-b2-03' },
    ]);

    await listener.handleMetrics(
      event({
        changedVms: [],
        hosts: [
          createHostTelemetry({
            connectionState: 'notResponding',
            health: 'down',
          }),
        ],
      }),
    );

    expect(alertService.raise).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AlertType.HOST_DISCONNECTED,
        severity: AlertSeverity.CRITICAL,
      }),
    );
  });
});
