import { Test, TestingModule } from '@nestjs/testing';
import { OnduleurController } from './onduleur.controller';

describe('OnduleurController', () => {
  let controller: OnduleurController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnduleurController],
    }).compile();

    controller = module.get<OnduleurController>(OnduleurController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
