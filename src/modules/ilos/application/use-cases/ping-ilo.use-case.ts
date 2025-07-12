import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PingService, PingResult } from '@/core/services/ping';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';

@Injectable()
export class PingIloUseCase {
  private readonly logger = new Logger(PingIloUseCase.name);

  constructor(
    private readonly pingService: PingService,
    private readonly getServerWithIloUseCase: GetServerWithIloUseCase,
  ) {}

  async execute(serverId: string, timeout?: number): Promise<PingResult> {
    if (!serverId || typeof serverId !== 'string' || serverId.trim() === '') {
      throw new BadRequestException(
        'Server ID must be a valid non-empty string',
      );
    }

    const server = await this.getServerWithIloUseCase.execute(serverId);
    
    this.logger.log(`Pinging iLO for server ${serverId} at host ${server.ilo.ip}`);
    
    const result = await this.pingService.ping(server.ilo.ip, timeout);
    
    this.logger.log(
      `Ping result for server ${serverId} iLO: ${result.accessible ? 'accessible' : 'not accessible'}`
    );
    
    return result;
  }
}