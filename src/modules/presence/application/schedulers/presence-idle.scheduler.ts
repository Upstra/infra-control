import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PresenceService } from '../services/presence.service';
import { PresenceDomainService } from '../../domain/services/presence.domain.service';
import { PresenceStatus } from '../../domain/interfaces/presence.interface';
import { UserGateway } from '../gateway/user.gateway';

const SWEEP_INTERVAL_MS = 30_000;

@Injectable()
export class PresenceIdleScheduler {
  private readonly lastStatus = new Map<string, PresenceStatus>();

  constructor(
    private readonly presenceService: PresenceService,
    private readonly presenceDomain: PresenceDomainService,
    private readonly gateway: UserGateway,
  ) {}

  @Interval(SWEEP_INTERVAL_MS)
  async sweep(now = Date.now()): Promise<number> {
    const online = await this.presenceService.listOnline();
    const seen = new Set<string>();
    let changed = 0;
    for (const { userId, record } of online) {
      seen.add(userId);
      const status = this.presenceDomain.status(record, now);
      const previous = this.lastStatus.get(userId);
      this.lastStatus.set(userId, status);
      if (previous !== undefined && previous !== status) {
        this.gateway.broadcast(userId, record);
        changed++;
      }
    }
    [...this.lastStatus.keys()]
      .filter((userId) => !seen.has(userId))
      .forEach((userId) => this.lastStatus.delete(userId));
    return changed;
  }
}
