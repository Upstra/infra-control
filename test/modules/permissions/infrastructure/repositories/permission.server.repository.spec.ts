import { Test, TestingModule } from '@nestjs/testing';
import { PermissionServerRepository } from '../../../../src/modules/permissions/infrastructure/repositories/permission.server.repository';

describe('PermissionServerRepository', () => {
  let provider: PermissionServerRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionServerRepository],
    }).compile();

    provider = module.get<PermissionServerRepository>(PermissionServerRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
