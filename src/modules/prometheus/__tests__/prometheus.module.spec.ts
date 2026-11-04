import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule } from '../../redis/redis.module';
import { RedisSafeService } from '../../redis/application/services/redis-safe.service';
import { PrometheusModule } from '../prometheus.module';
import { PrometheusController } from '../application/controllers/prometheus.controller';
import { PrometheusModule as NestPrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  providers: [{ provide: RedisSafeService, useValue: {} }],
  exports: [RedisSafeService],
})
class FakeRedisModule {}

describe('PrometheusModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrometheusModule],
    })
      .overrideModule(RedisModule)
      .useModule(FakeRedisModule)
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have PrometheusController', () => {
    const controller = module.get<PrometheusController>(PrometheusController);
    expect(controller).toBeDefined();
  });

  it('should import NestPrometheusModule', () => {
    const nestPrometheusModule = module.get(NestPrometheusModule);
    expect(nestPrometheusModule).toBeDefined();
  });
});
