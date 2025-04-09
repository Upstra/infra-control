import { Test, TestingModule } from '@nestjs/testing';
import { VmService } from '../../../../src/modules/vms/application/services/vm.service';

describe('VmService', () => {
  let provider: VmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VmService],
    }).compile();

    provider = module.get<VmService>(VmService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
