import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  /**
   * Ping a hostname/IP address without persisting to database
   * @param hostname - IP address or hostname to ping
   * @returns Promise with ping result
   */
  async pingHost(hostname: string): Promise<{
    success: boolean;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Try ICMP ping
      const pingResult = await this.performICMPPing(hostname);
      const responseTime = Date.now() - startTime;

      if (!pingResult.success) {
        return {
          success: false,
          error: pingResult.error,
        };
      }

      return {
        success: true,
        responseTime,
      };
    } catch (error) {
      this.logger.error(`Ping failed for ${hostname}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Perform ICMP ping using system ping command
   */
  private async performICMPPing(hostname: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const isWindows = process.platform === 'win32';
      const pingCommand = isWindows
        ? `ping -n 1 -w 2000 ${hostname}`
        : `ping -c 1 -W 2 ${hostname}`;

      const { stdout, stderr } = await execAsync(pingCommand);

      if (stderr) {
        return {
          success: false,
          error: stderr,
        };
      }

      // Check if ping was successful
      const successPatterns = [
        /1 packets transmitted, 1 received/i,
        /1 packets transmitted, 1 packets received/i,
        /Reply from/i,
        /bytes from/i,
      ];

      const isSuccess = successPatterns.some((pattern) => pattern.test(stdout));

      return {
        success: isSuccess,
        error: isSuccess ? undefined : 'No response from host',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Ping command failed',
      };
    }
  }
}
