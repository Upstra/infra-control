import { Injectable } from '@nestjs/common';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import {
  PresenceActivity,
  PresenceRecord,
} from '../../domain/interfaces/presence.interface';

export const PRESENCE_TTL_SECONDS = 60;
const PREFIX = 'presence:';

@Injectable()
export class PresenceService {
  constructor(private readonly redisSafeService: RedisSafeService) {}

  async markOnline(userId: string): Promise<PresenceRecord> {
    const previous = await this.getRecord(userId);
    const now = new Date().toISOString();
    return this.save(userId, {
      route: previous?.route ?? null,
      title: previous?.title ?? null,
      lastActivityAt: now,
      connectedAt: previous?.connectedAt ?? now,
    });
  }

  async recordActivity(
    userId: string,
    activity: PresenceActivity = {},
  ): Promise<PresenceRecord> {
    const previous = await this.getRecord(userId);
    const now = new Date().toISOString();
    return this.save(userId, {
      route:
        activity.route !== undefined
          ? activity.route
          : (previous?.route ?? null),
      title:
        activity.title !== undefined
          ? activity.title
          : (previous?.title ?? null),
      lastActivityAt:
        activity.active === false ? (previous?.lastActivityAt ?? null) : now,
      connectedAt: previous?.connectedAt ?? now,
    });
  }

  async markOffline(userId: string): Promise<void> {
    await this.redisSafeService.safeDel(`${PREFIX}${userId}`);
  }

  async isOnline(userId: string): Promise<boolean> {
    return !!(await this.redisSafeService.safeGet(`${PREFIX}${userId}`));
  }

  async getRecord(userId: string): Promise<PresenceRecord | null> {
    return this.parse(
      await this.redisSafeService.safeGet(`${PREFIX}${userId}`),
    );
  }

  async listOnline(): Promise<
    Array<{ userId: string; record: PresenceRecord }>
  > {
    const keys = await this.redisSafeService.keys(`${PREFIX}*`);
    if (keys.length === 0) return [];
    const values = await this.redisSafeService.safeMGet(keys);
    return keys
      .map((key, index) => ({
        userId: key.slice(PREFIX.length),
        record: this.parse(values[index] ?? null),
      }))
      .filter(
        (entry): entry is { userId: string; record: PresenceRecord } =>
          entry.record !== null,
      );
  }

  async trackUsers(userIds: string[]): Promise<boolean[]> {
    const presenceKeys = userIds.map((id) => `${PREFIX}${id}`);
    const presenceValues = await this.redisSafeService.safeMGet(presenceKeys);
    return presenceValues.map((value) => !!value);
  }

  async refreshTTL(userId: string): Promise<void> {
    await this.redisSafeService.safeExpire(
      `${PREFIX}${userId}`,
      PRESENCE_TTL_SECONDS,
    );
  }

  async getConnectedUserCount(): Promise<number> {
    const keys = await this.redisSafeService.keys(`${PREFIX}*`);
    return keys.length;
  }

  private async save(
    userId: string,
    record: PresenceRecord,
  ): Promise<PresenceRecord> {
    await this.redisSafeService.safeSetEx(
      `${PREFIX}${userId}`,
      PRESENCE_TTL_SECONDS,
      JSON.stringify(record),
    );
    return record;
  }

  private parse(value: string | null): PresenceRecord | null {
    if (!value) return null;
    if (value === 'online') {
      return {
        route: null,
        title: null,
        lastActivityAt: null,
        connectedAt: null,
      };
    }
    try {
      return JSON.parse(value) as PresenceRecord;
    } catch {
      return null;
    }
  }
}
