import { UpsAlertsListener } from '../ups-alerts.listener';
import { AlertSeverity, AlertType } from '../../../domain/types/alert.types';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '@/modules/ups/__mocks__/ups-telemetry.mock';

describe('UpsAlertsListener', () => {
  const alertService = { raise: jest.fn(), resolve: jest.fn() };
  const redis = { safeIncr: jest.fn(), safeDel: jest.fn() };
  const listener = new UpsAlertsListener(alertService as any, redis as any);
  const status = createMockBatteryStatus({ upsId: 'ups-1', upsName: 'UPS-B2' });

  beforeEach(() => jest.clearAllMocks());

  it('opens on_battery on status change, then confirms it and raises low battery on LB', async () => {
    await listener.handleStatusChanged({
      upsId: 'ups-1',
      upsName: 'UPS-B2',
      previous: false,
      current: true,
      at: new Date(),
      status,
    });

    expect(alertService.raise).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupKey: 'ups:ups-1:on_battery',
        type: AlertType.UPS_ON_BATTERY,
        severity: AlertSeverity.CRITICAL,
        title: 'UPS-B2 est sur batterie',
      }),
    );

    jest.clearAllMocks();
    const telemetry = createMockUpsTelemetry();
    await listener.handleBatteryChecked(
      createMockBatteryStatus({
        upsId: 'ups-1',
        upsName: 'UPS-B2',
        minutesRemaining: 9,
        telemetry: {
          ...telemetry,
          status: { ...telemetry.status, onBattery: true, lowBattery: true },
        },
      }),
    );

    const raised = alertService.raise.mock.calls.map(([input]) => input.type);
    expect(raised).toEqual([
      AlertType.UPS_ON_BATTERY,
      AlertType.UPS_LOW_BATTERY,
    ]);
    expect(redis.safeDel).toHaveBeenCalledWith('alerts:ups:failures:ups-1');
  });

  it('resolves on_battery and low_battery when mains come back', async () => {
    await listener.handleStatusChanged({
      upsId: 'ups-1',
      upsName: 'UPS-B2',
      previous: true,
      current: false,
      at: new Date(),
      status: createMockBatteryStatus({ telemetry: createMockUpsTelemetry() }),
    });

    const keys = alertService.resolve.mock.calls.map(([key]) => key);
    expect(keys).toEqual(['ups:ups-1:on_battery', 'ups:ups-1:low_battery']);
    expect(alertService.raise).not.toHaveBeenCalled();
  });

  it('raises ups_unreachable on the third consecutive failure only', async () => {
    const failure = {
      upsId: 'ups-1',
      upsName: 'UPS-B2',
      ip: '10.0.0.1',
      error: 'timeout',
      at: new Date(),
    };
    redis.safeIncr.mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    await listener.handleCheckFailed(failure);
    expect(alertService.raise).not.toHaveBeenCalled();

    await listener.handleCheckFailed(failure);
    expect(alertService.raise).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AlertType.UPS_UNREACHABLE,
        severity: AlertSeverity.WARNING,
      }),
    );
  });
});
