import { Test, TestingModule } from '@nestjs/testing';
import { VmController } from '../../../../src/modules/vms/application/controllers/vm.controller';

describe('VmController', () => {
  let provider: VmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VmController],
    }).compile();

    provider = module.get<VmController>(VmController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
