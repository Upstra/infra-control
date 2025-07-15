import { Injectable, Logger } from '@nestjs/common';
import { RedisSafeService } from '../../../redis/application/services/redis-safe.service';
import { DiscoverySessionData } from '../interfaces/discovery-session.interface';
import { DiscoveryStatus } from '../../application/dto';

@Injectable()
export class DiscoverySessionService {
  private readonly logger = new Logger(DiscoverySessionService.name);
  private readonly SESSION_PREFIX = 'discovery:session:';
  private readonly ACTIVE_SESSION_KEY = 'discovery:active';
  private readonly SESSION_TTL = 3600; // 1 hour

  constructor(private readonly redisSafeService: RedisSafeService) {}

  async createSession(sessionId: string, totalServers: number): Promise<void> {
    const sessionData: DiscoverySessionData = {
      sessionId,
      status: DiscoveryStatus.STARTING,
      totalServers,
      serversProcessed: 0,
      successfulServers: 0,
      failedServers: 0,
      totalVmsDiscovered: 0,
      serverResults: [],
      failedServerIds: [],
      progress: 0,
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redisSafeService.safeSetEx(key, this.SESSION_TTL, JSON.stringify(sessionData));

    await this.redisSafeService.safeSetEx(this.ACTIVE_SESSION_KEY, this.SESSION_TTL, sessionId);

    this.logger.log(`Created discovery session: ${sessionId}`);
  }

  async getSession(sessionId: string): Promise<DiscoverySessionData | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.redisSafeService.safeGet(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  async getActiveSession(): Promise<DiscoverySessionData | null> {
    const activeSessionId = await this.redisSafeService.safeGet(this.ACTIVE_SESSION_KEY);

    if (!activeSessionId) {
      return null;
    }

    return this.getSession(activeSessionId);
  }

  async updateSession(
    sessionId: string,
    updates: Partial<DiscoverySessionData>,
  ): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      this.logger.warn(`Session ${sessionId} not found for update`);
      return;
    }

    const updatedSession: DiscoverySessionData = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    };

    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redisSafeService.safeSetEx(key, this.SESSION_TTL, JSON.stringify(updatedSession));
  }

  async completeSession(
    sessionId: string,
    results: Partial<DiscoverySessionData>,
  ): Promise<void> {
    await this.updateSession(sessionId, {
      ...results,
      status: DiscoveryStatus.COMPLETED,
      completedAt: new Date(),
    });

    // Remove from active session
    const activeSessionId = await this.redisSafeService.safeGet(this.ACTIVE_SESSION_KEY);
    if (activeSessionId === sessionId) {
      await this.redisSafeService.safeDel(this.ACTIVE_SESSION_KEY);
    }
  }

  async cancelSession(sessionId: string): Promise<void> {
    await this.updateSession(sessionId, {
      status: DiscoveryStatus.CANCELLED,
      completedAt: new Date(),
    });

    // Remove from active session
    const activeSessionId = await this.redisSafeService.safeGet(this.ACTIVE_SESSION_KEY);
    if (activeSessionId === sessionId) {
      await this.redisSafeService.safeDel(this.ACTIVE_SESSION_KEY);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redisSafeService.safeDel(key);

    // Remove from active if it's the active one
    const activeSessionId = await this.redisSafeService.safeGet(this.ACTIVE_SESSION_KEY);
    if (activeSessionId === sessionId) {
      await this.redisSafeService.safeDel(this.ACTIVE_SESSION_KEY);
    }
  }

  async isSessionActive(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return (
      session?.status === DiscoveryStatus.DISCOVERING ||
      session?.status === DiscoveryStatus.STARTING
    );
  }
}
