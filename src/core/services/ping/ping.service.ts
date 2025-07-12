import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';

export interface PingResult {
  accessible: boolean;
  responseTime?: number;
  error?: string;
  host: string;
}

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);
  private readonly defaultTimeout = 5000; // 5 seconds

  async ping(host: string, timeout?: number): Promise<PingResult> {
    const pingTimeout = timeout ?? this.defaultTimeout;

    this.logger.log(`Pinging host: ${host}`);

    return new Promise((resolve) => {
      const startTime = Date.now();
      const isWindows = process.platform === 'win32';
      const pingCommand = isWindows ? 'ping' : 'ping';
      const pingArgs = isWindows
        ? ['-n', '1', '-w', Math.floor(pingTimeout).toString(), host]
        : ['-c', '1', '-W', Math.floor(pingTimeout / 1000).toString(), host];

      const pingProcess = spawn(pingCommand, pingArgs);

      let stdout = '';
      let stderr = '';

      const timeoutId = setTimeout(() => {
        pingProcess.kill();
        resolve({
          accessible: false,
          error: `Ping timeout after ${pingTimeout}ms`,
          host,
        });
      }, pingTimeout);

      pingProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pingProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pingProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        this.logger.error(`Failed to execute ping command: ${error.message}`);
        resolve({
          accessible: false,
          error: `Failed to execute ping: ${error.message}`,
          host,
        });
      });

      pingProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (code === 0) {
          const extractedTime = this.extractResponseTime(stdout, isWindows);
          this.logger.log(
            `Host ${host} is accessible (${extractedTime ?? responseTime}ms)`,
          );
          resolve({
            accessible: true,
            responseTime: extractedTime ?? responseTime,
            host,
          });
        } else {
          this.logger.warn(
            `Host ${host} is not accessible: ${stderr || 'Unknown error'}`,
          );
          resolve({
            accessible: false,
            error: stderr || `Ping failed with exit code ${code}`,
            host,
          });
        }
      });
    });
  }

  private extractResponseTime(
    output: string,
    isWindows: boolean,
  ): number | null {
    try {
      if (isWindows) {
        const match = output.match(/time[<>=](\d+)ms/i);
        return match ? parseInt(match[1], 10) : null;
      } else {
        const match = output.match(/time=([0-9.]+) ms/i);
        return match ? parseFloat(match[1]) : null;
      }
    } catch {
      return null;
    }
  }

  async batchPing(hosts: string[], timeout?: number): Promise<PingResult[]> {
    this.logger.log(`Batch pinging ${hosts.length} hosts`);

    const promises = hosts.map((host) => this.ping(host, timeout));
    return Promise.all(promises);
  }
}
