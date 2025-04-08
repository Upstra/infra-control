import { Test, TestingModule } from '@nestjs/testing';
import { UpsController } from './ups.controller';

describe('UpsController', () => {
  let controller: UpsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpsController],
    }).compile();

    controller = module.get<UpsController>(UpsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
