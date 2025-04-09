import { Test, TestingModule } from '@nestjs/testing';
import { UpsService } from '../../../../src/modules/ups/application/services/ups.service';

describe('UpsService', () => {
  let provider: UpsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpsService],
    }).compile();

    provider = module.get<UpsService>(UpsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
