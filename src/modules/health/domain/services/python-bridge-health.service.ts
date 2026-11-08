import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  IHealthCheckService,
  HealthCheckResult,
} from '../interfaces/health-check.interface';

const DEFAULT_SCRIPTS_PATH = '/home/upstra/ups_manager';
const PROBE_TIMEOUT_MS = 10_000;
const CACHE_MS = 60_000;
// The modules every VMware / iLO / UPS script needs to start at all.
const PROBE = 'import pyVmomi, requests, yaml';

/**
 * Every VMware, iLO and UPS action goes through the `ups_manager` Python
 * scripts. This checks that their interpreter starts and can load its
 * dependencies — the failure mode that silently breaks discovery, metrics and
 * shutdowns. The probe spawns a process, so its result is cached for a minute.
 */
@Injectable()
export class PythonBridgeHealthService implements IHealthCheckService {
  private cached: { at: number; result: HealthCheckResult } | null = null;

  constructor(private readonly configService: ConfigService) {}

  async checkHealth(): Promise<HealthCheckResult> {
    if (this.cached && Date.now() - this.cached.at < CACHE_MS) {
      return this.cached.result;
    }
    const result = await this.probe();
    this.cached = { at: Date.now(), result };
    return result;
  }

  private async probe(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const scriptsPath =
      this.configService.get<string>('PYTHON_SCRIPTS_PATH') ??
      DEFAULT_SCRIPTS_PATH;
    const python = join(scriptsPath, '.venv', 'bin', 'python');

    if (!existsSync(python)) {
      return {
        name: 'python',
        status: 'down',
        message: `Python environment not found at ${python}`,
        responseTime: Date.now() - startTime,
        details: { scriptsPath },
      };
    }

    const { ok, stderr } = await this.run(python);
    return {
      name: 'python',
      status: ok ? 'up' : 'down',
      message: ok
        ? 'ups_manager scripts ready'
        : `ups_manager dependencies failed to load: ${stderr || 'timeout'}`,
      responseTime: Date.now() - startTime,
      details: { scriptsPath },
    };
  }

  private run(python: string): Promise<{ ok: boolean; stderr: string }> {
    return new Promise((resolve) => {
      let stderr = '';
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        resolve({ ok, stderr: stderr.trim().split('\n').pop() ?? '' });
      };
      const child = spawn(python, ['-c', PROBE], {
        stdio: ['ignore', 'ignore', 'pipe'],
        timeout: PROBE_TIMEOUT_MS,
      });
      child.stderr?.on('data', (chunk) => (stderr += chunk.toString()));
      child.on('exit', (code) => finish(code === 0));
      child.on('error', (error) => {
        stderr = error.message;
        finish(false);
      });
    });
  }
}
