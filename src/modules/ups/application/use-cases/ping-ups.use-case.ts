import { Injectable, Logger } from '@nestjs/common';
import { PingService, PingResult } from '@/core/services/ping';

@Injectable()
export class PingUpsUseCase {
  private readonly logger = new Logger(PingUpsUseCase.name);

  constructor(private readonly pingService: PingService) {}

  async execute(upsId: string, host: string, timeout?: number): Promise<PingResult> {
    this.logger.log(`Pinging UPS ${upsId} at host ${host}`);
    
    const result = await this.pingService.ping(host, timeout);
    
    this.logger.log(
      `Ping result for UPS ${upsId}: ${result.accessible ? 'accessible' : 'not accessible'}`
    );
    
    return result;
  }
}