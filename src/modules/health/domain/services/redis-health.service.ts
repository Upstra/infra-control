import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import {
  IHealthCheckService,
  HealthCheckResult,
} from '../interfaces/health-check.interface';

@Injectable()
export class RedisHealthService implements IHealthCheckService {
  constructor(private readonly redisService: RedisService) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const redis = this.redisService.getOrNil();

      if (!redis) {
        return {
          name: 'redis',
          status: 'down',
          message: 'Redis client not available',
          responseTime: Date.now() - startTime,
        };
      }

      const pingResult = await redis.ping();
      const responseTime = Date.now() - startTime;

      if (pingResult === 'PONG') {
        const info = await redis.info('server');
        const memory = await redis.info('memory');

        const serverInfo = this.parseRedisInfo(info);
        const memoryInfo = this.parseRedisInfo(memory);

        return {
          name: 'redis',
          status: 'up',
          message: 'Redis connection is healthy',
          responseTime,
          details: {
            version: serverInfo.redis_version,
            uptime: parseInt(serverInfo.uptime_in_seconds, 10),
            connectedClients: parseInt(serverInfo.connected_clients, 10),
            usedMemory: memoryInfo.used_memory_human,
            maxMemory: memoryInfo.maxmemory_human || 'unlimited',
          },
        };
      }

      return {
        name: 'redis',
        status: 'down',
        message: 'Redis ping failed',
        responseTime,
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'down',
        message: `Redis error: ${error.message}`,
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }
}
