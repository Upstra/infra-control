import { Test, TestingModule } from '@nestjs/testing';
import { PermissionDomainVmService } from '../../../../src/modules/permissions/domain/services/permission.domain.vm.service';

describe('PermissionDomainVmService', () => {
  let provider: PermissionDomainVmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionDomainVmService],
    }).compile();

    provider = module.get<PermissionDomainVmService>(PermissionDomainVmService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
