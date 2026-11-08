import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './application/controllers/health.controller';
import { GetHealthStatusUseCase } from './application/use-cases/get-health-status.use-case';
import { DatabaseHealthService } from './domain/services/database-health.service';
import { RedisHealthService } from './domain/services/redis-health.service';
import { SystemHealthService } from './domain/services/system-health.service';
import { PythonBridgeHealthService } from './domain/services/python-bridge-health.service';
import { VcenterTelemetryHealthService } from './domain/services/vcenter-telemetry-health.service';
import { UpsTelemetryHealthService } from './domain/services/ups-telemetry-health.service';
import { PrometheusHealthService } from './domain/services/prometheus-health.service';
import { RedisModule } from '../redis/redis.module';
import { Server } from '../servers/domain/entities/server.entity';
import { Ups } from '../ups/domain/entities/ups.entity';

const CHECKS = [
  DatabaseHealthService,
  RedisHealthService,
  SystemHealthService,
  PythonBridgeHealthService,
  VcenterTelemetryHealthService,
  UpsTelemetryHealthService,
  PrometheusHealthService,
];

@Module({
  imports: [TypeOrmModule.forFeature([Server, Ups]), RedisModule],
  controllers: [HealthController],
  providers: [GetHealthStatusUseCase, ...CHECKS],
  exports: [GetHealthStatusUseCase, ...CHECKS],
})
export class HealthModule {}
