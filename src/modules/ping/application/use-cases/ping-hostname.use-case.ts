import { Injectable, BadRequestException } from '@nestjs/common';
import { PingService } from '../../domain/services/ping.service';
import { PingResponseDto } from '../dto/ping-response.dto';

@Injectable()
export class PingHostnameUseCase {
  constructor(private readonly pingService: PingService) {}

  /**
   * Execute ping test for a hostname/IP without persisting to database
   * @param hostname - IP address or hostname to ping
   * @returns PingResponseDto with the result
   */
  async execute(hostname: string): Promise<PingResponseDto> {
    // Validate hostname/IP format
    if (!this.isValidHostname(hostname)) {
      throw new BadRequestException('Invalid hostname or IP address format');
    }

    const result = await this.pingService.pingHost(hostname);

    return {
      host: hostname,
      accessible: result.success,
      responseTime: result.responseTime,
      error: result.error,
    };
  }

  /**
   * Validate if the provided string is a valid hostname or IP address
   */
  private isValidHostname(hostname: string): boolean {
    if (!hostname || hostname.trim().length === 0) {
      return false;
    }

    // IP address validation (IPv4)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      const parts = hostname.split('.');
      // Must have exactly 4 parts
      if (parts.length !== 4) return false;

      return parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }

    // IPv6 validation (simplified)
    const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;
    if (ipv6Regex.test(hostname)) {
      return true;
    }

    // Hostname validation
    const hostnameRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostnameRegex.test(hostname);
  }
}
