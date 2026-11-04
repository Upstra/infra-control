import { Module } from '@nestjs/common';
import { PrometheusModule as NestPrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrometheusController } from './application/controllers/prometheus.controller';
import { MetricSeriesController } from './application/controllers/metric-series.controller';
import { MetricsRegistryService } from './application/services/metrics-registry.service';
import { GetMetricSeriesUseCase } from './application/use-cases/get-metric-series.use-case';
import { PrometheusHttpClient } from './infrastructure/prometheus-http.client';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    NestPrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'infra_control_',
        },
      },
    }),
    RedisModule,
  ],
  controllers: [MetricSeriesController, PrometheusController],
  providers: [
    MetricsRegistryService,
    GetMetricSeriesUseCase,
    PrometheusHttpClient,
  ],
})
export class PrometheusModule {}
