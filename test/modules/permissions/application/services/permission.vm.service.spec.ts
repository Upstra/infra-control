import { Test, TestingModule } from '@nestjs/testing';
import { PermissionVmService } from '../../../../src/modules/permissions/application/services/permission.vm.service';

describe('PermissionVmService', () => {
  let provider: PermissionVmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionVmService],
    }).compile();

    provider = module.get<PermissionVmService>(PermissionVmService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
