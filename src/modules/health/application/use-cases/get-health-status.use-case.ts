import { Injectable } from '@nestjs/common';
import { DatabaseHealthService } from '../../domain/services/database-health.service';
import { RedisHealthService } from '../../domain/services/redis-health.service';
import { SystemHealthService } from '../../domain/services/system-health.service';
import { PythonBridgeHealthService } from '../../domain/services/python-bridge-health.service';
import { VcenterTelemetryHealthService } from '../../domain/services/vcenter-telemetry-health.service';
import { UpsTelemetryHealthService } from '../../domain/services/ups-telemetry-health.service';
import { PrometheusHealthService } from '../../domain/services/prometheus-health.service';
import { HealthResponseDto } from '../dto/health-response.dto';
import {
  HealthCheckResult,
  IHealthCheckService,
} from '../../domain/interfaces/health-check.interface';

/** Without these the API cannot serve anything: their loss is an outage. */
export const CRITICAL_SERVICES = ['database', 'redis'];

@Injectable()
export class GetHealthStatusUseCase {
  private readonly checks: Array<[string, IHealthCheckService]>;

  constructor(
    databaseHealthService: DatabaseHealthService,
    redisHealthService: RedisHealthService,
    systemHealthService: SystemHealthService,
    pythonBridgeHealthService: PythonBridgeHealthService,
    vcenterTelemetryHealthService: VcenterTelemetryHealthService,
    upsTelemetryHealthService: UpsTelemetryHealthService,
    prometheusHealthService: PrometheusHealthService,
  ) {
    this.checks = [
      ['database', databaseHealthService],
      ['redis', redisHealthService],
      ['system', systemHealthService],
      ['python', pythonBridgeHealthService],
      ['vcenter', vcenterTelemetryHealthService],
      ['ups', upsTelemetryHealthService],
      ['prometheus', prometheusHealthService],
    ];
  }

  async execute(): Promise<HealthResponseDto> {
    const startTime = Date.now();

    const settled = await Promise.allSettled(
      this.checks.map(([, service]) => service.checkHealth()),
    );

    const checks: HealthCheckResult[] = settled.map((result, index) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            name: this.checks[index][0],
            status: 'down' as const,
            message: `Health check failed: ${result.reason?.message || 'Unknown error'}`,
            responseTime: 0,
          },
    );

    const summary = {
      total: checks.length,
      up: checks.filter((check) => check.status === 'up').length,
      down: checks.filter((check) => check.status === 'down').length,
      unknown: checks.filter((check) => check.status === 'unknown').length,
    };

    let overallStatus: 'up' | 'down' | 'degraded';
    if (summary.down > 0) {
      const criticalDown = checks.some(
        (check) =>
          check.status === 'down' && CRITICAL_SERVICES.includes(check.name),
      );
      overallStatus = criticalDown ? 'down' : 'degraded';
    } else if (summary.unknown > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'up';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalResponseTime: Date.now() - startTime,
      checks,
      summary,
    };
  }
}
