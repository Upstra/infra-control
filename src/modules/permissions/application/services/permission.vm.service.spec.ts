import { Test, TestingModule } from '@nestjs/testing';
import { PermissionVmService } from './permission.vm.service';

describe('PermissionVmService', () => {
  let service: PermissionVmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionVmService],
    }).compile();

    service = module.get<PermissionVmService>(PermissionVmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
