import { Module } from '@nestjs/common';
import { RedisModule as RedisCoreModule } from '@liaoliaots/nestjs-redis';
import { redisConfig } from '@/core/config/redis.config';

@Module({
  imports: [RedisCoreModule.forRoot({ config: redisConfig })],
  exports: [RedisCoreModule],
})
export class RedisModule {}
