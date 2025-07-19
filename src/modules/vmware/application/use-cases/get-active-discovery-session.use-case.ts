import { Injectable } from '@nestjs/common';
import { DiscoverySessionService } from '../../domain/services/discovery-session.service';
import { DiscoverySessionData } from '../../domain/interfaces/discovery-session.interface';

@Injectable()
export class GetActiveDiscoverySessionUseCase {
  constructor(
    private readonly discoverySessionService: DiscoverySessionService,
  ) {}

  async execute(): Promise<DiscoverySessionData | null> {
    return this.discoverySessionService.getActiveSession();
  }
}
