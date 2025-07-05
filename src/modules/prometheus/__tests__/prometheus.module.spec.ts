import { Test, TestingModule } from '@nestjs/testing';
import { PrometheusModule } from '../prometheus.module';
import { PrometheusController } from '../application/controllers/prometheus.controller';
import { PrometheusModule as NestPrometheusModule } from '@willsoto/nestjs-prometheus';

describe('PrometheusModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PrometheusModule],
    }).compile();
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
