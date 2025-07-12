import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PingService, PingResult } from '@/core/services/ping';
import { GetServerByIdUseCase } from './get-server-by-id.use-case';

@Injectable()
export class PingServerUseCase {
  private readonly logger = new Logger(PingServerUseCase.name);

  constructor(
    private readonly pingService: PingService,
    private readonly getServerByIdUseCase: GetServerByIdUseCase,
  ) {}

  async execute(serverId: string, timeout?: number): Promise<PingResult> {
    if (!serverId || typeof serverId !== 'string' || serverId.trim() === '') {
      throw new BadRequestException(
        'Server ID must be a valid non-empty string',
      );
    }

    const server = await this.getServerByIdUseCase.execute(serverId);

    this.logger.log(`Pinging server ${serverId} at host ${server.ip}`);

    const result = await this.pingService.ping(server.ip, timeout);

    this.logger.log(
      `Ping result for server ${serverId}: ${result.accessible ? 'accessible' : 'not accessible'}`,
    );

    return result;
  }
}
