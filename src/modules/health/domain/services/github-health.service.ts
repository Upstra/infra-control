import { Injectable } from '@nestjs/common';
import {
  IHealthCheckService,
  HealthCheckResult,
} from '../interfaces/health-check.interface';

@Injectable()
export class GitHubHealthService implements IHealthCheckService {
  private readonly githubApiUrl = 'https://api.github.com/zen';
  private readonly timeout = 5000;

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        return {
          name: 'github',
          status: 'unknown',
          message: 'GitHub API token not configured',
          responseTime: Date.now() - startTime,
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.githubApiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'InfraControl-HealthCheck',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const zenMessage = await response.text();
        return {
          name: 'github',
          status: 'up',
          message: 'GitHub API is accessible',
          responseTime,
          details: {
            statusCode: response.status,
            rateLimit: response.headers.get('x-ratelimit-remaining'),
            rateLimitReset: response.headers.get('x-ratelimit-reset'),
            zen: zenMessage.substring(0, 50) + '...',
          },
        };
      }

      return {
        name: 'github',
        status: 'down',
        message: `GitHub API returned ${response.status}: ${response.statusText}`,
        responseTime,
        details: {
          statusCode: response.status,
          statusText: response.statusText,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error.name === 'AbortError') {
        return {
          name: 'github',
          status: 'down',
          message: 'GitHub API request timed out',
          responseTime,
          details: {
            error: 'Request timeout',
            timeout: this.timeout,
          },
        };
      }

      return {
        name: 'github',
        status: 'down',
        message: `GitHub API error: ${error.message}`,
        responseTime,
        details: {
          error: error.message,
        },
      };
    }
  }
}
