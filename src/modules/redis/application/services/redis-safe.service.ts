import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisSafeService {
  private online = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private readonly logger = new Logger(RedisSafeService.name);

  constructor(private readonly redisService: RedisService) {
    this.tryConnect();
  }

  private get redisClient(): Redis | null {
    // getOrNil() te renvoie soit le client, soit null si Redis down
    return this.redisService.getOrNil();
  }

  private tryConnect() {
    if (this.redisClient) {
      this.online = true;
      this.logger.log('Redis connecté');
      if (this.reconnectInterval) clearInterval(this.reconnectInterval);
    } else {
      this.online = false;
      this.logger.error('Redis offline, tentative de reconnexion…');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) return;
    this.reconnectInterval = setInterval(() => this.tryConnect(), 30000);
  }

  isOnline() {
    return this.online;
  }

  async safeGet(key: string) {
    const client = this.redisClient;
    if (!client) return null;
    try {
      return await client.get(key);
    } catch (e) {
      this.online = false;
      this.logger.error('Erreur Redis: ' + e.message);
      this.scheduleReconnect();
      return null;
    }
  }

  async safeSet(key: string, value: string) {
    const client = this.redisClient;
    if (!client) return;
    try {
      await client.set(key, value);
    } catch (e) {
      this.online = false;
      this.logger.error('Erreur Redis: ' + e.message);
      this.scheduleReconnect();
    }
  }

  async safeDel(key: string) {
    const client = this.redisClient;
    if (!client) return;
    try {
      await client.del(key);
    } catch (e) {
      this.online = false;
      this.logger.error('Erreur Redis: ' + e.message);
      this.scheduleReconnect();
    }
  }

  async safeExpire(key: string, seconds: number) {
    const client = this.redisClient;
    if (!client) return;
    try {
      await client.expire(key, seconds);
    } catch (e) {
      this.online = false;
      this.logger.error('Erreur Redis: ' + e.message);
      this.scheduleReconnect();
    }
  }
}
