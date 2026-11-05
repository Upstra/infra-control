import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { setupValidationPipe } from '@/core/config/validation.config';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { MetricSeriesController } from '@/modules/prometheus/application/controllers/metric-series.controller';
import { GetMetricSeriesUseCase } from '@/modules/prometheus/application/use-cases/get-metric-series.use-case';
import { PrometheusHttpClient } from '@/modules/prometheus/infrastructure/prometheus-http.client';
import { FakeRedis, TestAuthGuard } from './support/in-memory';

describe('Measurement history served from Prometheus (e2e)', () => {
  let app: INestApplication;
  const prometheus = { queryRange: jest.fn() };
  const redis = new FakeRedis();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MetricSeriesController],
      providers: [
        GetMetricSeriesUseCase,
        { provide: PrometheusHttpClient, useValue: prometheus },
        { provide: RedisSafeService, useValue: redis },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(setupValidationPipe());
    await app.init();
  });

  beforeEach(() => {
    prometheus.queryRange.mockReset();
    redis.store.clear();
  });

  afterAll(async () => app.close());

  it('returns the total power curve with one point every 15 s over 1 h', async () => {
    const now = Math.floor(Date.now() / 1000);
    prometheus.queryRange.mockResolvedValue([
      {
        metric: {},
        values: [
          [now - 30, '1830'],
          [now - 15, '1842'],
          [now, '1851'],
        ],
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/metrics/series?metric=total_power&scope=total&range=1h')
      .expect(200);

    expect(prometheus.queryRange).toHaveBeenCalledWith(
      'sum(upstra_ups_real_power_watts)',
      now - 3600,
      now,
      15,
    );
    expect(response.body).toMatchObject({
      metric: 'total_power',
      unit: 'W',
      step: 15,
    });
    expect(
      response.body.series[0].points.map(([timestamp]) => timestamp),
    ).toEqual([(now - 30) * 1000, (now - 15) * 1000, now * 1000]);
  });

  it('rejects any metric or id outside the whitelist before reaching Prometheus', async () => {
    await request(app.getHttpServer())
      .get('/metrics/series?metric=up&scope=total&range=1h')
      .expect(400);
    await request(app.getHttpServer())
      .get(
        `/metrics/series?metric=ups_load&scope=ups&id=${encodeURIComponent('x"} or vector(1)')}&range=24h`,
      )
      .expect(400);

    expect(prometheus.queryRange).not.toHaveBeenCalled();
  });

  it('answers 503 HISTORY_UNAVAILABLE when Prometheus is down', async () => {
    prometheus.queryRange.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const response = await request(app.getHttpServer())
      .get('/metrics/series?metric=ups_real_power&scope=total&range=7d')
      .expect(503);

    expect(JSON.stringify(response.body)).toContain('HISTORY_UNAVAILABLE');
  });
});
