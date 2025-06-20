import { Injectable } from '@nestjs/common';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';

@Injectable()
export class PresenceService {
  constructor(private readonly redisSafeService: RedisSafeService) {}

  async markOnline(userId: string): Promise<void> {
    await this.redisSafeService.safeSet(`presence:${userId}`, 'online');
  }

  async markOffline(userId: string): Promise<void> {
    await this.redisSafeService.safeDel(`presence:${userId}`);
  }

  async isOnline(userId: string): Promise<boolean> {
    return !!(await this.redisSafeService.safeGet(`presence:${userId}`));
  }

  async refreshTTL(userId: string): Promise<void> {
    await this.redisSafeService.safeExpire(`presence:${userId}`, 60);
  }

  async getConnectedUserCount(): Promise<number> {
    const keys = await this.redisSafeService.keys('presence:*');
    return keys.length;
  }
}
