import { Module } from '@nestjs/common';
import { RedisModule as RedisCoreModule } from '@liaoliaots/nestjs-redis';
import { redisConfig } from '@/common/config/redis.config';

@Module({
  imports: [RedisCoreModule.forRoot({ config: redisConfig })],
  exports: [RedisCoreModule],
})
export class RedisModule {}
