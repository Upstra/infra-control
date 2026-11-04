import { VmHealthDomainService } from '../vm-health.domain.service';
import {
  createInventoryHost,
  createInventoryVm,
} from '../../../__mocks__/vmware-telemetry.mock';

describe('VmHealthDomainService', () => {
  const service = new VmHealthDomainService();

  it('marks a powered off VM as down', () => {
    expect(
      service.evaluateVm(createInventoryVm({ powerState: 'poweredOff' }), 0, 90)
        .health,
    ).toBe('down');
    expect(
      service.evaluateVm(createInventoryVm({ powerState: 'suspended' }), 0, 90)
        .health,
    ).toBe('down');
  });

  it('marks a running VM with a gray heartbeat as unknown', () => {
    expect(
      service.evaluateVm(createInventoryVm({ heartbeat: 'gray' }), 0, 90)
        .health,
    ).toBe('unknown');
    expect(
      service.isStale(
        '2026-11-04T20:00:00.000Z',
        60,
        Date.parse('2026-11-04T20:03:01.000Z'),
      ),
    ).toBe(true);
  });

  it('degrades a VM only after two consecutive readings above the CPU threshold', () => {
    const hot = createInventoryVm({ cpuPercent: 95 });

    const first = service.evaluateVm(hot, 0, 90);
    const second = service.evaluateVm(hot, first.cpuHighStreak, 90);

    expect(first).toEqual({ health: 'up', cpuHighStreak: 1 });
    expect(second).toEqual({ health: 'degraded', cpuHighStreak: 2 });
    expect(
      service.evaluateHost(createInventoryHost({ maintenance: true }), 0, 90)
        .health,
    ).toBe('degraded');
  });
});
