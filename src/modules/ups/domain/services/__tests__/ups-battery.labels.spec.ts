import { UpsBatteryDomainService } from '../ups-battery.domain.service';
import { createMockUpsTelemetry } from '../../../__mocks__/ups-telemetry.mock';

describe('UpsBatteryDomainService labels and flags', () => {
  const service = new UpsBatteryDomainService();
  const base = createMockUpsTelemetry();
  const withStatus = (status: object, runtimeSeconds: number | null = 3600) =>
    createMockUpsTelemetry({
      status: { ...base.status, ...status },
      battery: { ...base.battery, runtimeSeconds },
    });

  it('goes critical on battery with the LB flag or under five minutes', () => {
    expect(
      service.calculateAlertLevel(
        withStatus({ onBattery: true, lowBattery: true }),
        50,
      ),
    ).toBe('critical');
    expect(
      service.calculateAlertLevel(withStatus({ onBattery: true }), 4),
    ).toBe('critical');
    expect(
      service.enrichBatteryStatus(
        'u',
        'ip',
        null,
        withStatus({ onBattery: true }, null),
      ).statusLabel,
    ).toBe('Sur batterie');
  });

  it('warns on mains for an overload or a battery to replace', () => {
    expect(
      service.enrichBatteryStatus(
        'u',
        'ip',
        null,
        withStatus({ overload: true }),
      ).statusLabel,
    ).toBe('Sur secteur - Surcharge');
    expect(
      service.enrichBatteryStatus(
        'u',
        'ip',
        null,
        withStatus({ replaceBattery: true }),
      ).alertLevel,
    ).toBe('warning');
    expect(
      service.enrichBatteryStatus(
        'u',
        'ip',
        null,
        withStatus({ onBattery: true }, 600),
      ).statusLabel,
    ).toBe('Sur batterie - Préparer shutdown');
  });

  it('keeps the legacy thresholds when the mains status is unknown', () => {
    expect(service.calculateAlertLevel(null, null)).toBe('normal');
    expect(service.calculateAlertLevel(null, 3)).toBe('critical');
    expect(service.enrichBatteryStatus('u', 'ip', 120).statusLabel).toBe(
      'Statut secteur inconnu - Normal',
    );
  });
});
