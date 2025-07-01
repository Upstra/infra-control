import { Injectable } from '@nestjs/common';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';

@Injectable()
export class PresenceService {
  constructor(private readonly redisSafeService: RedisSafeService) {}

  async markOnline(userId: string): Promise<void> {
    await this.redisSafeService.safeSet(`presence:${userId}`, 'online');
    await this.redisSafeService.safeExpire(`presence:${userId}`, 60);
  }

  async markOffline(userId: string): Promise<void> {
    await this.redisSafeService.safeDel(`presence:${userId}`);
  }

  async isOnline(userId: string): Promise<boolean> {
    return !!(await this.redisSafeService.safeGet(`presence:${userId}`));
  }

  /**
   * Track multiple users if they are online with a safe get operation.
   * @param userIds - Array of user IDs to check
   * @returns Array of boole
   * indicating if each user is online
   * */
  async trackUsers(userIds: string[]): Promise<boolean[]> {
    const presenceKeys = userIds.map((id) => `presence:${id}`);
    const presenceValues = await this.redisSafeService.safeMGet(presenceKeys);
    return presenceValues.map((value) => !!value);
  }

  async refreshTTL(userId: string): Promise<void> {
    await this.redisSafeService.safeExpire(`presence:${userId}`, 60);
  }

  /**
   * Count currently connected users based on Redis presence keys.
   *
   * @returns number of user sessions marked as online
   */
  async getConnectedUserCount(): Promise<number> {
    const keys = await this.redisSafeService.keys('presence:*');
    return keys.length;
  }
}
