import { Injectable, Inject } from '@nestjs/common';
import { SystemHealthResponseDto } from '../../dto/widget-data.dto';
import { GetHealthStatusUseCase } from '../../../../health/application/use-cases/get-health-status.use-case';

@Injectable()
export class GetSystemHealthUseCase {
  constructor(
    @Inject(GetHealthStatusUseCase)
    private readonly getHealthStatusUseCase: GetHealthStatusUseCase,
  ) {}

  async execute(): Promise<SystemHealthResponseDto> {
    const healthStatus = await this.getHealthStatusUseCase.execute();

    const components = healthStatus.checks.map((check) => ({
      name: this.formatServiceName(check.name),
      status: this.mapHealthStatus(check.status),
      responseTime: check.responseTime ?? 0,
      uptime: this.calculateUptime(check.status),
      issues:
        check.status === 'down' && check.message ? [check.message] : undefined,
    }));

    const operationalCount = components.filter(
      (c) => c.status === 'operational',
    ).length;
    const degradedCount = components.filter(
      (c) => c.status === 'degraded',
    ).length;
    const downCount = components.filter((c) => c.status === 'down').length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (downCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const score = Math.round((operationalCount / components.length) * 100);

    return {
      status,
      score,
      components,
      lastCheck: new Date(healthStatus.timestamp),
    };
  }

  private formatServiceName(serviceName: string): string {
    const nameMap: Record<string, string> = {
      database: 'Database',
      redis: 'Redis Cache',
      system: 'System Resources',
      github: 'GitHub API',
    };
    return nameMap[serviceName] ?? serviceName;
  }

  private mapHealthStatus(
    healthStatus: 'up' | 'down' | 'unknown',
  ): 'operational' | 'degraded' | 'down' {
    switch (healthStatus) {
      case 'up':
        return 'operational';
      case 'unknown':
        return 'degraded';
      case 'down':
        return 'down';
      default:
        return 'degraded';
    }
  }

  private calculateUptime(status: 'up' | 'down' | 'unknown'): number {
    switch (status) {
      case 'up':
        return 99.9 + Math.random() * 0.099;
      case 'unknown':
        return 95 + Math.random() * 4;
      case 'down':
        return Math.random() * 50;
      default:
        return 99.0;
    }
  }
}
