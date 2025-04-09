import { Test, TestingModule } from '@nestjs/testing';
import { VmModule } from '../../../../src/modules/vms/vm.module';

describe('VmModule', () => {
  let provider: VmModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VmModule],
    }).compile();

    provider = module.get<VmModule>(VmModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
