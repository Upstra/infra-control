import { Test, TestingModule } from '@nestjs/testing';
import { GroupVmService } from '../../../../../src/modules/groups/application/services/group.vm.service';

describe('GroupVmService', () => {
  let provider: GroupVmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupVmService],
    }).compile();

    provider = module.get<GroupVmService>(GroupVmService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
