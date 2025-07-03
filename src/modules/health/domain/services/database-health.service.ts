import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  IHealthCheckService,
  HealthCheckResult,
} from '../interfaces/health-check.interface';

@Injectable()
export class DatabaseHealthService implements IHealthCheckService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!this.dataSource.isInitialized) {
        return {
          name: 'database',
          status: 'down',
          message: 'Database connection not initialized',
          responseTime: Date.now() - startTime,
        };
      }

      const result = await this.dataSource.query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;

      if (result && result.length > 0 && result[0].health_check === 1) {
        return {
          name: 'database',
          status: 'up',
          message: 'Database connection is healthy',
          responseTime,
          details: {
            database: this.dataSource.options.database,
            type: this.dataSource.options.type,
            isInitialized: this.dataSource.isInitialized,
          },
        };
      }

      return {
        name: 'database',
        status: 'down',
        message: 'Database health check query failed',
        responseTime,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'down',
        message: `Database error: ${error.message}`,
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
          isInitialized: this.dataSource?.isInitialized || false,
        },
      };
    }
  }
}
