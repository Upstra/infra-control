import { Test, TestingModule } from '@nestjs/testing';
import { UserModule } from '../../../../src/modules/users/user.module';

describe('UserModule', () => {
  let provider: UserModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserModule],
    }).compile();

    provider = module.get<UserModule>(UserModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
