import { Test, TestingModule } from '@nestjs/testing';
import { PermissionVmServiceService } from './permission.vm.service.service';

describe('PermissionVmServiceService', () => {
  let service: PermissionVmServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionVmServiceService],
    }).compile();

    service = module.get<PermissionVmServiceService>(
      PermissionVmServiceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
