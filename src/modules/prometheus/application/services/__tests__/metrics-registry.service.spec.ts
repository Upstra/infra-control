import { register } from 'prom-client';
import { MetricsRegistryService } from '../metrics-registry.service';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '@/modules/ups/__mocks__/ups-telemetry.mock';

describe('MetricsRegistryService', () => {
  let service: MetricsRegistryService;
  const value = async (name: string) =>
    (await register.getSingleMetric(name)!.get()).values;

  beforeEach(() => {
    register.clear();
    service = new MetricsRegistryService();
  });

  it('sets UPS gauges from the telemetry with the expected labels', async () => {
    service.handleUpsChecked(
      createMockBatteryStatus({
        upsId: 'ups-1',
        upsName: 'UPS-B2',
        roomId: 'room-b',
        telemetry: createMockUpsTelemetry(),
        onBattery: false,
        batteryPercentage: 100,
        loadPercent: 40,
      }),
    );

    expect(await value('upstra_ups_real_power_watts')).toEqual([
      {
        value: 1200,
        labels: { ups_id: 'ups-1', ups_name: 'UPS-B2', room_id: 'room-b' },
      },
    ]);
    expect((await value('upstra_ups_on_battery'))[0].value).toBe(0);
  });

  it('does not create a series for a null value', async () => {
    const telemetry = createMockUpsTelemetry({ temperatureC: null });

    service.handleUpsChecked(
      createMockBatteryStatus({ upsId: 'ups-1', upsName: 'UPS-B2', telemetry }),
    );

    expect(await value('upstra_ups_temperature_celsius')).toEqual([]);
    expect(await value('upstra_ups_battery_charge_percent')).toEqual([]);
  });

  it('removes the series of a deleted UPS and exposes open alerts', async () => {
    service.handleUpsChecked(
      createMockBatteryStatus({
        upsId: 'ups-1',
        upsName: 'UPS-B2',
        telemetry: createMockUpsTelemetry(),
      }),
    );

    service.handleUpsDeleted({ upsId: 'ups-1' });
    service.handleAlertSummary({
      open: { critical: 1, warning: 0, info: 2 },
      unacknowledgedCritical: 1,
    });

    expect(await value('upstra_ups_real_power_watts')).toEqual([]);
    expect(await value('upstra_alerts_open')).toEqual(
      expect.arrayContaining([{ value: 1, labels: { severity: 'critical' } }]),
    );
  });
});
