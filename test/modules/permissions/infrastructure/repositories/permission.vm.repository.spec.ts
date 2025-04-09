import { Test, TestingModule } from '@nestjs/testing';
import { PermissionVmRepository } from '../../../../src/modules/permissions/infrastructure/repositories/permission.vm.repository';

describe('PermissionVmRepository', () => {
  let provider: PermissionVmRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionVmRepository],
    }).compile();

    provider = module.get<PermissionVmRepository>(PermissionVmRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
