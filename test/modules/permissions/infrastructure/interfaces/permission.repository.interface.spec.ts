import { Test, TestingModule } from '@nestjs/testing';
import { PermissionRepositoryInterface } from '../../../../src/modules/permissions/infrastructure/interfaces/permission.repository.interface';

describe('PermissionRepositoryInterface', () => {
  let provider: PermissionRepositoryInterface;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionRepositoryInterface],
    }).compile();

    provider = module.get<PermissionRepositoryInterface>(PermissionRepositoryInterface);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
