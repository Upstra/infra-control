import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from '../../../../src/modules/roles/application/controllers/role.controller';

describe('RoleController', () => {
  let provider: RoleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleController],
    }).compile();

    provider = module.get<RoleController>(RoleController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
