import { Test, TestingModule } from '@nestjs/testing';
import { IloService } from '../../../../../src/modules/ilos/application/services/ilo.service';

describe('IloService', () => {
  let provider: IloService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IloService],
    }).compile();

    provider = module.get<IloService>(IloService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
