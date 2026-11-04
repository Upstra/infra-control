import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const DEFAULT_PROMETHEUS_URL = 'http://prometheus:9090';
const TIMEOUT_MS = 5000;

export interface PrometheusMatrixSeries {
  metric: Record<string, string>;
  values: Array<[number, string]>;
}

@Injectable()
export class PrometheusHttpClient {
  constructor(private readonly configService: ConfigService) {}

  async queryRange(
    query: string,
    start: number,
    end: number,
    step: number,
  ): Promise<PrometheusMatrixSeries[]> {
    const baseUrl =
      this.configService.get<string>('PROMETHEUS_URL') ??
      DEFAULT_PROMETHEUS_URL;
    const response = await axios.get(`${baseUrl}/api/v1/query_range`, {
      params: { query, start, end, step },
      timeout: TIMEOUT_MS,
    });
    if (response.data?.status !== 'success') {
      throw new Error(response.data?.error ?? 'Prometheus query failed');
    }
    return response.data.data?.result ?? [];
  }
}
