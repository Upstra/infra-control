import { Injectable } from '@nestjs/common';
import * as os from 'os';
import {
  IHealthCheckService,
  HealthCheckResult,
  SystemHealthInfo,
} from '../interfaces/health-check.interface';

@Injectable()
export class SystemHealthService implements IHealthCheckService {
  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const systemInfo = await this.getSystemInfo();
      const responseTime = Date.now() - startTime;

      const memoryThreshold = 90;
      const isMemoryHealthy = systemInfo.memory.percentage < memoryThreshold;

      const diskThreshold = 90;
      const isDiskHealthy = systemInfo.disk
        ? systemInfo.disk.percentage < diskThreshold
        : true;

      const status = isMemoryHealthy && isDiskHealthy ? 'up' : 'down';

      let message = 'System resources are healthy';
      if (!isMemoryHealthy) {
        message = `Memory usage is above ${memoryThreshold}%`;
      } else if (!isDiskHealthy) {
        message = `Disk usage is above ${diskThreshold}%`;
      }

      return {
        name: 'system',
        status,
        message,
        responseTime,
        details: {
          ...systemInfo,
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
          pid: process.pid,
        },
      };
    } catch (error) {
      return {
        name: 'system',
        status: 'down',
        message: `System health check failed: ${error.message}`,
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private async getSystemInfo(): Promise<SystemHealthInfo> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const systemInfo: SystemHealthInfo = {
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      uptime: os.uptime(),
    };

    return systemInfo;
  }
}
