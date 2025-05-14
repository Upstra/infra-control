import { RedisClientOptions } from '@liaoliaots/nestjs-redis';

export const redisConfig: RedisClientOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS ? {} : undefined,
};
