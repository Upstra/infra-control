import { Test, TestingModule } from '@nestjs/testing';
import { GroupVmController } from '../../../../../src/modules/groups/application/controllers/group.vm.controller';

describe('GroupVmController', () => {
  let provider: GroupVmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupVmController],
    }).compile();

    provider = module.get<GroupVmController>(GroupVmController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
