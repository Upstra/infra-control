import { Test, TestingModule } from '@nestjs/testing';
import { PermissionModule } from '../../../../src/modules/permissions/permission.module';

describe('PermissionModule', () => {
  let provider: PermissionModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionModule],
    }).compile();

    provider = module.get<PermissionModule>(PermissionModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
