import { Module } from '@nestjs/common';
import { RedisModule as RedisCoreModule } from '@liaoliaots/nestjs-redis';
import { redisConfig } from '@/core/config/redis.config';
import { RedisSafeService } from './application/services/redis-safe.service';

@Module({
  imports: [RedisCoreModule.forRoot({ config: redisConfig })],
  providers: [RedisSafeService],
  exports: [RedisSafeService],
})
export class RedisModule {}
