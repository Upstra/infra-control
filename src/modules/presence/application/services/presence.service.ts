import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class PresenceService {
  private readonly redisClient: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redisClient = this.redisService.getOrThrow();
  }

  async markOnline(userId: string): Promise<void> {
    await this.redisClient.set(`presence:${userId}`, 'online');
  }

  async markOffline(userId: string): Promise<void> {
    await this.redisClient.del(`presence:${userId}`);
  }

  async isOnline(userId: string): Promise<boolean> {
    return !!(await this.redisClient.get(`presence:${userId}`));
  }

  async refreshTTL(userId: string): Promise<void> {
    await this.redisClient.expire(`presence:${userId}`, 60);
  }
}
