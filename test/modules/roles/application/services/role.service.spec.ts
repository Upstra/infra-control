import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '../../../../src/modules/roles/application/services/role.service';

describe('RoleService', () => {
  let provider: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService],
    }).compile();

    provider = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
