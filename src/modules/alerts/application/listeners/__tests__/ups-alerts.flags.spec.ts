import { UpsAlertsListener } from '../ups-alerts.listener';
import { AlertType } from '../../../domain/types/alert.types';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '@/modules/ups/__mocks__/ups-telemetry.mock';

describe('UpsAlertsListener device flags', () => {
  const alertService = { raise: jest.fn(), resolve: jest.fn() };
  const redis = { safeIncr: jest.fn(), safeDel: jest.fn() };
  const listener = new UpsAlertsListener(alertService as any, redis as any);
  const base = createMockUpsTelemetry();

  beforeEach(() => jest.clearAllMocks());

  it('raises overload and replace-battery alerts on mains and resolves them when the flags clear', async () => {
    const flagged = createMockUpsTelemetry({
      status: { ...base.status, overload: true, replaceBattery: true },
    });
    await listener.handleBatteryChecked(
      createMockBatteryStatus({
        upsId: 'u1',
        upsName: 'UPS-B2',
        telemetry: flagged,
        loadPercent: 120,
      }),
    );
    await listener.handleBatteryChecked(
      createMockBatteryStatus({
        upsId: 'u1',
        upsName: 'UPS-B2',
        telemetry: base,
      }),
    );

    expect(alertService.raise.mock.calls.map(([input]) => input.type)).toEqual([
      AlertType.UPS_OVERLOAD,
      AlertType.UPS_REPLACE_BATTERY,
    ]);
    expect(alertService.resolve.mock.calls.map(([key]) => key)).toEqual(
      expect.arrayContaining([
        'ups:u1:overload',
        'ups:u1:replace_battery',
        'ups:u1:low_battery',
      ]),
    );
  });

  it('only resets the failure counter for a legacy reading without telemetry', async () => {
    await listener.handleBatteryChecked(
      createMockBatteryStatus({ upsId: 'u2', telemetry: null }),
    );

    expect(redis.safeDel).toHaveBeenCalledWith('alerts:ups:failures:u2');
    expect(alertService.raise).not.toHaveBeenCalled();
  });

  it('never throws when the alert store fails', async () => {
    alertService.resolve.mockRejectedValueOnce(new Error('db down'));
    redis.safeIncr.mockResolvedValueOnce(null);

    await expect(
      listener.handleBatteryChecked(createMockBatteryStatus()),
    ).resolves.toBeUndefined();
    await expect(
      listener.handleCheckFailed({
        upsId: 'u',
        upsName: 'n',
        ip: 'i',
        error: 'e',
        at: new Date(),
      }),
    ).resolves.toBeUndefined();
  });
});
