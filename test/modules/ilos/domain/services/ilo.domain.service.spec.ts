import { Test, TestingModule } from '@nestjs/testing';
import { IloDomainService } from '../../../../src/modules/ilos/domain/services/ilo.domain.service';

describe('IloDomainService', () => {
  let provider: IloDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IloDomainService],
    }).compile();

    provider = module.get<IloDomainService>(IloDomainService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
