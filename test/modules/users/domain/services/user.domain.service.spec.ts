import { Test, TestingModule } from '@nestjs/testing';
import { UserDomainService } from '../../../../src/modules/users/domain/services/user.domain.service';

describe('UserDomainService', () => {
  let provider: UserDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserDomainService],
    }).compile();

    provider = module.get<UserDomainService>(UserDomainService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
