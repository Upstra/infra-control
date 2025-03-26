import { Test, TestingModule } from '@nestjs/testing';
import { IloController } from './ilo.controller';

describe('IloController', () => {
  let controller: IloController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IloController],
    }).compile();

    controller = module.get<IloController>(IloController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
