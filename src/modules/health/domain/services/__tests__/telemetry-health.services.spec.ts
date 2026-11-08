import axios from 'axios';
import { VcenterTelemetryHealthService } from '../vcenter-telemetry-health.service';
import { UpsTelemetryHealthService } from '../ups-telemetry-health.service';
import { PrometheusHealthService } from '../prometheus-health.service';

jest.mock('axios');

const config = (values: Record<string, unknown> = {}) =>
  ({ get: jest.fn((key: string) => values[key]) }) as any;

const secondsAgo = (s: number) => new Date(Date.now() - s * 1000).toISOString();

describe('VcenterTelemetryHealthService', () => {
  const make = (vcenters: number, collectedAt: string | null) =>
    new VcenterTelemetryHealthService(
      { safeGet: jest.fn().mockResolvedValue(collectedAt) } as any,
      config(),
      { count: jest.fn().mockResolvedValue(vcenters) } as any,
    );

  it('is unknown while no vCenter is configured', async () => {
    expect((await make(0, null).checkHealth()).status).toBe('unknown');
  });

  it('is up when the snapshot is recent', async () => {
    const result = await make(1, secondsAgo(30)).checkHealth();
    expect(result.status).toBe('up');
    expect(result.details?.ageSeconds).toBeGreaterThanOrEqual(29);
  });

  it('is down once three collections were missed', async () => {
    expect((await make(1, secondsAgo(181)).checkHealth()).status).toBe('down');
  });

  it('is down when nothing was ever collected', async () => {
    const result = await make(1, null).checkHealth();
    expect(result.status).toBe('down');
    expect(result.message).toContain('No vCenter snapshot');
  });
});

describe('UpsTelemetryHealthService', () => {
  const reading = (s: number) => JSON.stringify({ timestamp: secondsAgo(s) });
  const make = (ups: Array<{ id: string; name: string }>, raw: any[]) =>
    new UpsTelemetryHealthService(
      { safeMGet: jest.fn().mockResolvedValue(raw) } as any,
      { find: jest.fn().mockResolvedValue(ups) } as any,
    );

  it('is unknown while no UPS is configured', async () => {
    expect((await make([], []).checkHealth()).status).toBe('unknown');
  });

  it('is up when every UPS has a recent reading', async () => {
    const result = await make(
      [
        { id: 'a', name: 'UPS-A' },
        { id: 'b', name: 'UPS-B' },
      ],
      [reading(20), reading(70)],
    ).checkHealth();
    expect(result.status).toBe('up');
  });

  it('names the UPS whose reading is missing or stale', async () => {
    const result = await make(
      [
        { id: 'a', name: 'UPS-A' },
        { id: 'b', name: 'UPS-B' },
        { id: 'c', name: 'UPS-C' },
      ],
      [reading(20), null, reading(600)],
    ).checkHealth();
    expect(result.status).toBe('down');
    expect(result.details?.stale).toEqual(['UPS-B', 'UPS-C']);
  });
});

describe('PrometheusHealthService', () => {
  const get = axios.get as jest.Mock;
  beforeEach(() => get.mockReset());

  it('probes the configured URL readiness endpoint', async () => {
    get.mockResolvedValue({ status: 200 });
    const result = await new PrometheusHealthService(
      config({ PROMETHEUS_URL: 'http://prom:9090' }),
    ).checkHealth();
    expect(get).toHaveBeenCalledWith(
      'http://prom:9090/-/ready',
      expect.any(Object),
    );
    expect(result.status).toBe('up');
  });

  it('is down when Prometheus is unreachable', async () => {
    get.mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await new PrometheusHealthService(config()).checkHealth();
    expect(result.status).toBe('down');
    expect(result.message).toContain('ECONNREFUSED');
  });
});
