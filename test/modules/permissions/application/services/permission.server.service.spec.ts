import { Test, TestingModule } from '@nestjs/testing';
import { PermissionServerService } from '../../../../src/modules/permissions/application/services/permission.server.service';

describe('PermissionServerService', () => {
  let provider: PermissionServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionServerService],
    }).compile();

    provider = module.get<PermissionServerService>(PermissionServerService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
