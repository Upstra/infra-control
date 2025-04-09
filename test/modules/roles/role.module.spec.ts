import { Test, TestingModule } from '@nestjs/testing';
import { RoleModule } from '../../../../src/modules/roles/role.module';

describe('RoleModule', () => {
  let provider: RoleModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleModule],
    }).compile();

    provider = module.get<RoleModule>(RoleModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
