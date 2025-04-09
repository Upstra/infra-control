import { Test, TestingModule } from '@nestjs/testing';
import { UpsModule } from '../../../../src/modules/ups/ups.module';

describe('UpsModule', () => {
  let provider: UpsModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpsModule],
    }).compile();

    provider = module.get<UpsModule>(UpsModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
