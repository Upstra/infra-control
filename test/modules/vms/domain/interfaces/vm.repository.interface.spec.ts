import { Test, TestingModule } from '@nestjs/testing';
import { VmRepositoryInterface } from '../../../../src/modules/vms/domain/interfaces/vm.repository.interface';

describe('VmRepositoryInterface', () => {
  let provider: VmRepositoryInterface;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VmRepositoryInterface],
    }).compile();

    provider = module.get<VmRepositoryInterface>(VmRepositoryInterface);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
