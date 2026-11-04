import { parseUpsTelemetry } from '../ups-telemetry.parser';

describe('parseUpsTelemetry', () => {
  it('parses a complete NUT telemetry payload', () => {
    const parsed = parseUpsTelemetry({
      source: 'nut',
      collectedAt: '2026-11-04T20:01:44.000Z',
      device: {
        manufacturer: 'APC',
        model: 'Smart-UPS SRT 3000',
        serial: null,
        firmware: null,
      },
      status: {
        raw: 'OB DISCHRG',
        onBattery: true,
        lowBattery: false,
        charging: false,
        onBypass: false,
        overload: false,
        replaceBattery: false,
      },
      battery: {
        chargePercent: 38,
        runtimeSeconds: 840,
        voltage: null,
        temperatureC: null,
        lastTestResult: null,
        lastTestAt: null,
      },
      input: { voltage: 0, frequencyHz: null },
      output: { voltage: 230, frequencyHz: 50 },
      load: { percent: 61, realPowerW: 1840, nominalRealPowerW: 3000 },
      temperatureC: 31,
    });

    expect(parsed).toEqual(expect.objectContaining({ kind: 'telemetry' }));
    if (parsed?.kind !== 'telemetry') throw new Error('unexpected');
    expect(parsed.telemetry.status.onBattery).toBe(true);
    expect(parsed.telemetry.input.voltage).toBe(0);
    expect(parsed.telemetry.load.realPowerW).toBe(1840);
  });

  it('turns missing fields into null', () => {
    const parsed = parseUpsTelemetry(
      JSON.stringify({ source: 'snmp', status: {} }),
    );

    if (parsed?.kind !== 'telemetry') throw new Error('unexpected');
    expect(parsed.telemetry.status.onBattery).toBeNull();
    expect(parsed.telemetry.battery.chargePercent).toBeNull();
    expect(parsed.telemetry.temperatureC).toBeNull();
    expect(parsed.telemetry.device.model).toBeNull();
  });

  it('recognises the legacy integer output', () => {
    expect(parseUpsTelemetry(' 42\n')).toEqual({
      kind: 'minutes',
      minutes: 42,
    });
    expect(parseUpsTelemetry(17)).toEqual({ kind: 'minutes', minutes: 17 });
    expect(parseUpsTelemetry('not a number')).toBeNull();
  });
});
