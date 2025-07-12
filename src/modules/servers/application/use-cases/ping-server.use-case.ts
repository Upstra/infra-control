import { Injectable, Logger } from '@nestjs/common';
import { PingService, PingResult } from '@/core/services/ping';

@Injectable()
export class PingServerUseCase {
  private readonly logger = new Logger(PingServerUseCase.name);

  constructor(private readonly pingService: PingService) {}

  async execute(serverId: string, host: string, timeout?: number): Promise<PingResult> {
    this.logger.log(`Pinging server ${serverId} at host ${host}`);
    
    const result = await this.pingService.ping(host, timeout);
    
    this.logger.log(
      `Ping result for server ${serverId}: ${result.accessible ? 'accessible' : 'not accessible'}`
    );
    
    return result;
  }
}