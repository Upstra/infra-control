import { Injectable, Inject } from '@nestjs/common';
import { SystemHealthResponseDto } from '../../dto/widget-data.dto';
import { DatabaseHealthService } from '../../../../health/domain/services/database-health.service';
import { RedisHealthService } from '../../../../health/domain/services/redis-health.service';

@Injectable()
export class GetSystemHealthUseCase {
  constructor(
    @Inject(DatabaseHealthService)
    private readonly databaseHealthService: DatabaseHealthService,
    @Inject(RedisHealthService)
    private readonly redisHealthService: RedisHealthService,
  ) {}

  async execute(): Promise<SystemHealthResponseDto> {
    const [dbHealth, redisHealth] = await Promise.all([
      this.databaseHealthService.checkHealth(),
      this.redisHealthService.checkHealth(),
    ]);

    const components = [
      {
        name: 'API Backend',
        status: 'operational' as const,
        responseTime: 125,
        uptime: 99.98,
      },
      {
        name: 'Database',
        status: (dbHealth as any).isHealthy
          ? ('operational' as const)
          : ('down' as const),
        responseTime: dbHealth.responseTime || 0,
        uptime: 99.99,
      },
      {
        name: 'Redis Cache',
        status: (redisHealth as any).isHealthy
          ? ('operational' as const)
          : ('down' as const),
        responseTime: redisHealth.responseTime || 0,
        uptime: 99.95,
      },
    ];

    const unhealthyCount = components.filter(
      (c) => c.status !== 'operational',
    ).length;
    const degradedCount = components.filter(
      (c) => (c as any).status === 'degraded',
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const score = Math.round(
      (components.filter((c) => c.status === 'operational').length /
        components.length) *
        100,
    );

    return {
      status,
      score,
      components,
      lastCheck: new Date(),
    };
  }
}
