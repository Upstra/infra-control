import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { isIP } from 'net';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// RFC 1123 hostname. It can never start with '-' (no option injection) and
// holds no shell metacharacter.
const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const PING_TIMEOUT_MS = 5000;

export const isPingableHost = (host: string): boolean =>
  typeof host === 'string' && (isIP(host) !== 0 || HOSTNAME_PATTERN.test(host));

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
      if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
        return await this.performHttpCheck(hostname, startTime);
      }

      const pingResult = await this.performICMPPing(hostname);
      const responseTime = Date.now() - startTime;

      if (!pingResult.success) {
        return { success: false, error: pingResult.error };
      }

      return { success: true, responseTime };
    } catch (error) {
      this.logger.error(`Ping failed for ${hostname}:`, error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  private async performHttpCheck(
    baseUrl: string,
    startTime: number,
  ): Promise<{ success: boolean; responseTime?: number; error?: string }> {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/health`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const responseTime = Date.now() - startTime;
      if (response.ok) {
        return { success: true, responseTime };
      }
      return { success: false, error: `HTTP ${response.status}` };
    } catch (error) {
      return { success: false, error: error.message || 'HTTP check failed' };
    }
  }

  /**
   * Perform an ICMP ping with the system `ping` binary.
   *
   * The target comes straight from the request URL: it is validated and passed
   * as a separate argument through execFile (no shell), so a value such as
   * `8.8.8.8;id` can never run a command.
   */
  private async performICMPPing(hostname: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!isPingableHost(hostname)) {
      return { success: false, error: 'Invalid hostname or IP address' };
    }

    try {
      const isWindows = process.platform === 'win32';
      const args = isWindows
        ? ['-n', '1', '-w', '2000', hostname]
        : ['-c', '1', '-W', '2', hostname];

      const { stdout, stderr } = await execFileAsync('ping', args, {
        timeout: PING_TIMEOUT_MS,
      });

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
