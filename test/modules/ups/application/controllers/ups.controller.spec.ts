import { Test, TestingModule } from '@nestjs/testing';
import { UpsController } from '../../../../src/modules/ups/application/controllers/ups.controller';

describe('UpsController', () => {
  let provider: UpsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpsController],
    }).compile();

    provider = module.get<UpsController>(UpsController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
