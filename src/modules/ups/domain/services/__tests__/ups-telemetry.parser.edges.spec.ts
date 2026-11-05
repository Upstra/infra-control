import { parseUpsTelemetry, toUpsTelemetry } from '../ups-telemetry.parser';

describe('parseUpsTelemetry edge cases', () => {
  it('unwraps the legacy executor envelope and JSON strings', () => {
    expect(parseUpsTelemetry({ status: 'success', output: '25\n' })).toEqual({
      kind: 'minutes',
      minutes: 25,
    });
    const parsed = parseUpsTelemetry({
      status: 'success',
      output:
        '{"source":"nut","status":{"onBattery":true},"battery":{"chargePercent":"38"}}',
    });
    expect(parsed).toMatchObject({
      kind: 'telemetry',
      telemetry: {
        status: { onBattery: true },
        battery: { chargePercent: 38 },
      },
    });
  });

  it('refuses broken JSON, floats, arrays and unrelated objects', () => {
    expect(parseUpsTelemetry('{broken')).toBeNull();
    expect(parseUpsTelemetry(12.5)).toBeNull();
    expect(parseUpsTelemetry(['42'])).toBeNull();
    expect(parseUpsTelemetry({ hello: 'world' })).toBeNull();
  });

  it('normalises odd values to null instead of inventing numbers', () => {
    const telemetry = toUpsTelemetry({
      status: { onBattery: 'yes' },
      battery: {
        chargePercent: '',
        runtimeSeconds: Number.NaN,
        voltage: 'abc',
      },
      load: { percent: Infinity },
      device: { model: '' },
    });

    expect(telemetry.status.onBattery).toBeNull();
    expect(telemetry.battery).toMatchObject({
      chargePercent: null,
      runtimeSeconds: null,
      voltage: null,
    });
    expect(telemetry.load.percent).toBeNull();
    expect(telemetry.device.model).toBeNull();
    expect(telemetry.source).toBe('unknown');
  });
});
