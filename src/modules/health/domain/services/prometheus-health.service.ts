import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  IHealthCheckService,
  HealthCheckResult,
} from '../interfaces/health-check.interface';

// Same default as PrometheusHttpClient (history charts read from it).
const DEFAULT_PROMETHEUS_URL = 'http://prometheus:9090';
const TIMEOUT_MS = 3000;

/**
 * Prometheus stores the metric history behind every chart in the app. When
 * it is down the live views keep working but history and trends go blank.
 */
@Injectable()
export class PrometheusHealthService implements IHealthCheckService {
  constructor(private readonly configService: ConfigService) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const baseUrl =
      this.configService.get<string>('PROMETHEUS_URL') ??
      DEFAULT_PROMETHEUS_URL;

    try {
      const response = await axios.get(`${baseUrl}/-/ready`, {
        timeout: TIMEOUT_MS,
        validateStatus: () => true,
      });
      const ready = response.status === 200;
      return {
        name: 'prometheus',
        status: ready ? 'up' : 'down',
        message: ready
          ? 'Prometheus ready'
          : `Prometheus answered HTTP ${response.status}`,
        responseTime: Date.now() - startTime,
        details: { url: baseUrl },
      };
    } catch (error: any) {
      return {
        name: 'prometheus',
        status: 'down',
        message: `Prometheus unreachable: ${error?.message ?? 'unknown error'}`,
        responseTime: Date.now() - startTime,
        details: { url: baseUrl },
      };
    }
  }
}
