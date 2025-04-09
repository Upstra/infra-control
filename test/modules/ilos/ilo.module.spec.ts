import { Test, TestingModule } from '@nestjs/testing';
import { IloModule } from '../../../../src/modules/ilos/ilo.module';

describe('IloModule', () => {
  let provider: IloModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IloModule],
    }).compile();

    provider = module.get<IloModule>(IloModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
