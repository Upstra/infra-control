import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GetMetricSeriesUseCase } from '../get-metric-series.use-case';

describe('GetMetricSeriesUseCase', () => {
  const prometheus = { queryRange: jest.fn() };
  const redis = {
    safeGet: jest.fn().mockResolvedValue(null),
    safeSetEx: jest.fn(),
  };
  const useCase = new GetMetricSeriesUseCase(prometheus as any, redis as any);

  beforeEach(() => jest.clearAllMocks());

  it('rejects anything outside the whitelist without calling Prometheus', async () => {
    await expect(
      useCase.execute({
        metric: 'up{job="x"}',
        scope: 'total',
        range: '1h',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      useCase.execute({
        metric: 'ups_load',
        scope: 'ups',
        id: '") or vector(1',
        range: '1h',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prometheus.queryRange).not.toHaveBeenCalled();
  });

  it('builds the PromQL itself and uses a 120 s step for 24h', async () => {
    prometheus.queryRange.mockResolvedValue([
      { metric: { ups_name: 'UPS-B2' }, values: [[1762286400, '1830']] },
    ]);
    const id = '3f2c8a10-6d1e-4c7b-9a2f-0b1c2d3e4f50';

    const result = await useCase.execute({
      metric: 'ups_real_power',
      scope: 'ups',
      id,
      range: '24h',
    });

    const [query, start, end, step] = prometheus.queryRange.mock.calls[0];
    expect(query).toBe(`upstra_ups_real_power_watts{ups_id="${id}"}`);
    expect(end - start).toBe(86400);
    expect(step).toBe(120);
    expect(result).toEqual({
      metric: 'ups_real_power',
      unit: 'W',
      range: '24h',
      step: 120,
      series: [{ label: 'UPS-B2', points: [[1762286400000, 1830]] }],
    });
    expect(redis.safeSetEx).toHaveBeenCalledWith(
      expect.stringContaining('ups_real_power'),
      15,
      expect.any(String),
    );
  });

  it('answers 503 HISTORY_UNAVAILABLE when Prometheus is down', async () => {
    prometheus.queryRange.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const error = await useCase
      .execute({ metric: 'total_power', scope: 'total', range: '1h' })
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(error.getResponse()).toMatchObject({ code: 'HISTORY_UNAVAILABLE' });
  });
});
