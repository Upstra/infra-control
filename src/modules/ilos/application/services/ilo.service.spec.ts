import { Test, TestingModule } from '@nestjs/testing';
import { IloService } from './ilo.service';

describe('IloService', () => {
  let service: IloService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IloService],
    }).compile();

    service = module.get<IloService>(IloService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
