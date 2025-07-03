import { Module } from '@nestjs/common';
import { PrometheusModule as NestPrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrometheusController } from './application/controllers/prometheus.controller';

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
  ],
  controllers: [PrometheusController],
})
export class PrometheusModule {}
