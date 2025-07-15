import { Injectable, NotFoundException } from '@nestjs/common';
import { DiscoverySessionService } from '../../domain/services/discovery-session.service';
import { DiscoverySessionData } from '../../domain/interfaces/discovery-session.interface';

@Injectable()
export class GetDiscoverySessionUseCase {
  constructor(
    private readonly discoverySessionService: DiscoverySessionService,
  ) {}

  async execute(sessionId: string): Promise<DiscoverySessionData> {
    const session = await this.discoverySessionService.getSession(sessionId);

    if (!session) {
      throw new NotFoundException(`Discovery session ${sessionId} not found`);
    }

    return session;
  }
}
