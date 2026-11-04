import { UpsBatteryDomainService } from '../ups-battery.domain.service';
import { createMockUpsTelemetry } from '../../../__mocks__/ups-telemetry.mock';

describe('UpsBatteryDomainService', () => {
  const service = new UpsBatteryDomainService();

  it('keeps a UPS on mains normal even with 10 minutes of runtime', () => {
    const telemetry = createMockUpsTelemetry({
      battery: { ...createMockUpsTelemetry().battery, runtimeSeconds: 600 },
    });

    const status = service.enrichBatteryStatus(
      'ups-1',
      '10.0.0.1',
      null,
      telemetry,
    );

    expect(status.alertLevel).toBe('normal');
    expect(status.onBattery).toBe(false);
    expect(status.minutesRemaining).toBe(10);
  });

  it('raises a warning for a UPS on battery with 12 minutes left', () => {
    const base = createMockUpsTelemetry();
    const telemetry = createMockUpsTelemetry({
      status: { ...base.status, raw: 'OB DISCHRG', onBattery: true },
      battery: { ...base.battery, chargePercent: 38, runtimeSeconds: 720 },
    });

    const status = service.enrichBatteryStatus(
      'ups-1',
      '10.0.0.1',
      null,
      telemetry,
    );

    expect(status.alertLevel).toBe('warning');
    expect(status.batteryPercentage).toBe(38);
    expect(status.statusLabel).toContain('Sur batterie');
  });

  it('falls back to the minutes thresholds when the mains status is unknown', () => {
    const status = service.enrichBatteryStatus('ups-1', '10.0.0.1', 25);

    expect(status.alertLevel).toBe('low');
    expect(status.onBattery).toBeNull();
    expect(status.statusLabel).toContain('Statut secteur inconnu');
  });
});
