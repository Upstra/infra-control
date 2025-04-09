import { Test, TestingModule } from '@nestjs/testing';
import { PermissionVmController } from '../../../../src/modules/permissions/application/controllers/permission.vm.controller';

describe('PermissionVmController', () => {
  let provider: PermissionVmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionVmController],
    }).compile();

    provider = module.get<PermissionVmController>(PermissionVmController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
