import { VmHealthDomainService } from '../vm-health.domain.service';
import {
  createInventoryHost,
  createInventoryVm,
} from '../../../__mocks__/vmware-telemetry.mock';

describe('VmHealthDomainService hosts and edge cases', () => {
  const service = new VmHealthDomainService();

  it('marks a disconnected or powered off host as down while counting its CPU streak', () => {
    expect(
      service.evaluateHost(
        createInventoryHost({
          connectionState: 'notResponding',
          cpuPercent: 95,
        }),
        2,
        90,
      ),
    ).toEqual({
      health: 'down',
      cpuHighStreak: 3,
    });
    expect(
      service.evaluateHost(
        createInventoryHost({ powerState: 'standBy', cpuPercent: null }),
        2,
        90,
      ).cpuHighStreak,
    ).toBe(0);
    expect(
      service.evaluateHost(createInventoryHost({ overallStatus: 'red' }), 0, 90)
        .health,
    ).toBe('degraded');
  });

  it('treats an unreadable date as stale and a disconnected or red VM accordingly', () => {
    expect(service.isStale('not a date', 60)).toBe(true);
    expect(
      service.evaluateVm(
        createInventoryVm({ connectionState: 'orphaned' }),
        0,
        90,
      ).health,
    ).toBe('unknown');
    expect(
      service.evaluateVm(createInventoryVm({ heartbeat: 'red' }), 0, 90).health,
    ).toBe('degraded');
    expect(
      service.evaluateVm(
        createInventoryVm({ heartbeat: 'gray', powerState: 'poweredOff' }),
        0,
        90,
      ).health,
    ).toBe('down');
  });
});
