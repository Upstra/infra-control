export interface HealthCheckResult {
  name: string;
  status: 'up' | 'down' | 'unknown';
  message?: string;
  details?: Record<string, any>;
  responseTime?: number;
}

export interface IHealthCheckService {
  checkHealth(): Promise<HealthCheckResult>;
}

export interface SystemHealthInfo {
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  disk?: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}
