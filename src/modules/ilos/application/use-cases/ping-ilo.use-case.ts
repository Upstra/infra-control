import { Injectable, Logger } from '@nestjs/common';
import { PingService, PingResult } from '@/core/services/ping';

@Injectable()
export class PingIloUseCase {
  private readonly logger = new Logger(PingIloUseCase.name);

  constructor(private readonly pingService: PingService) {}

  async execute(iloId: string, host: string, timeout?: number): Promise<PingResult> {
    this.logger.log(`Pinging iLO ${iloId} at host ${host}`);
    
    const result = await this.pingService.ping(host, timeout);
    
    this.logger.log(
      `Ping result for iLO ${iloId}: ${result.accessible ? 'accessible' : 'not accessible'}`
    );
    
    return result;
  }
}