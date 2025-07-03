import { Injectable } from '@nestjs/common';
import { DatabaseHealthService } from '../../domain/services/database-health.service';
import { RedisHealthService } from '../../domain/services/redis-health.service';
import { SystemHealthService } from '../../domain/services/system-health.service';
import { GitHubHealthService } from '../../domain/services/github-health.service';
import { HealthResponseDto } from '../dto/health-response.dto';
import { HealthCheckResult } from '../../domain/interfaces/health-check.interface';

@Injectable()
export class GetHealthStatusUseCase {
  constructor(
    private readonly databaseHealthService: DatabaseHealthService,
    private readonly redisHealthService: RedisHealthService,
    private readonly systemHealthService: SystemHealthService,
    private readonly githubHealthService: GitHubHealthService,
  ) {}

  async execute(): Promise<HealthResponseDto> {
    const startTime = Date.now();

    const healthChecks = await Promise.allSettled([
      this.databaseHealthService.checkHealth(),
      this.redisHealthService.checkHealth(),
      this.systemHealthService.checkHealth(),
      this.githubHealthService.checkHealth(),
    ]);

    const checks: HealthCheckResult[] = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }

      const serviceNames = ['database', 'redis', 'system', 'github'];
      return {
        name: serviceNames[index],
        status: 'down' as const,
        message: `Health check failed: ${result.reason?.message || 'Unknown error'}`,
        responseTime: 0,
      };
    });

    const totalResponseTime = Date.now() - startTime;

    const summary = {
      total: checks.length,
      up: checks.filter((check) => check.status === 'up').length,
      down: checks.filter((check) => check.status === 'down').length,
      unknown: checks.filter((check) => check.status === 'unknown').length,
    };

    let overallStatus: 'up' | 'down' | 'degraded';
    if (summary.down > 0) {
      const criticalServices = ['database', 'redis'];
      const criticalDown = checks.filter(
        (check) =>
          check.status === 'down' && criticalServices.includes(check.name),
      );
      overallStatus = criticalDown.length > 0 ? 'down' : 'degraded';
    } else if (summary.unknown > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'up';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalResponseTime,
      checks,
      summary,
    };
  }
}
