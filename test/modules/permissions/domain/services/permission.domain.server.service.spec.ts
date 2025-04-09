import { Test, TestingModule } from '@nestjs/testing';
import { PermissionDomainServerService } from '../../../../src/modules/permissions/domain/services/permission.domain.server.service';

describe('PermissionDomainServerService', () => {
  let provider: PermissionDomainServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionDomainServerService],
    }).compile();

    provider = module.get<PermissionDomainServerService>(PermissionDomainServerService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
