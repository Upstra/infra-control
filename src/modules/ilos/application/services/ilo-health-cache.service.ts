import { Injectable } from '@nestjs/common';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { IloHealth } from '../../domain/interfaces/ilo-health.interface';

const HEALTH_KEY = (serverId: string) => `ilo:health:${serverId}`;
const FAILURES_KEY = (serverId: string) => `ilo:health:failures:${serverId}`;
const FAILURES_TTL_SECONDS = 3600;

@Injectable()
export class IloHealthCacheService {
  constructor(private readonly redis: RedisSafeService) {}

  async set(
    serverId: string,
    health: IloHealth,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.safeSetEx(
      HEALTH_KEY(serverId),
      ttlSeconds,
      JSON.stringify(health),
    );
  }

  async get(serverId: string): Promise<IloHealth | null> {
    return this.parse(await this.redis.safeGet(HEALTH_KEY(serverId)));
  }

  async getMany(serverIds: string[]): Promise<Record<string, IloHealth>> {
    if (serverIds.length === 0) return {};
    const values = await this.redis.safeMGet(serverIds.map(HEALTH_KEY));
    const result: Record<string, IloHealth> = {};
    serverIds.forEach((id, index) => {
      const health = this.parse(values[index] ?? null);
      if (health) result[id] = health;
    });
    return result;
  }

  async recordFailure(serverId: string): Promise<number> {
    return (
      (await this.redis.safeIncr(
        FAILURES_KEY(serverId),
        FAILURES_TTL_SECONDS,
      )) ?? 0
    );
  }

  async resetFailures(serverId: string): Promise<void> {
    await this.redis.safeDel(FAILURES_KEY(serverId));
  }

  private parse(value: string | null): IloHealth | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as IloHealth;
    } catch {
      return null;
    }
  }
}
