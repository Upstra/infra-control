import { Test, TestingModule } from '@nestjs/testing';
import { RoleDomainService } from '../../../../src/modules/roles/domain/services/role.domain.service';

describe('RoleDomainService', () => {
  let provider: RoleDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleDomainService],
    }).compile();

    provider = module.get<RoleDomainService>(RoleDomainService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
