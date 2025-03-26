import { Test, TestingModule } from '@nestjs/testing';
import { OnduleurService } from './onduleur.service';

describe('OnduleurService', () => {
  let service: OnduleurService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnduleurService],
    }).compile();

    service = module.get<OnduleurService>(OnduleurService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
