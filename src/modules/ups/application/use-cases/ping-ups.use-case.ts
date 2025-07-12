import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PingService, PingResult } from '@/core/services/ping';
import { GetUpsByIdUseCase } from './get-ups-by-id.use-case';

@Injectable()
export class PingUpsUseCase {
  private readonly logger = new Logger(PingUpsUseCase.name);

  constructor(
    private readonly pingService: PingService,
    private readonly getUpsByIdUseCase: GetUpsByIdUseCase,
  ) {}

  async execute(upsId: string, timeout?: number): Promise<PingResult> {
    if (!upsId || typeof upsId !== 'string' || upsId.trim() === '') {
      throw new BadRequestException(
        'UPS ID must be a valid non-empty string',
      );
    }

    const ups = await this.getUpsByIdUseCase.execute(upsId);
    
    this.logger.log(`Pinging UPS ${upsId} at host ${ups.ip}`);
    
    const result = await this.pingService.ping(ups.ip, timeout);
    
    this.logger.log(
      `Ping result for UPS ${upsId}: ${result.accessible ? 'accessible' : 'not accessible'}`
    );
    
    return result;
  }
}