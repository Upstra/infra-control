import { Test, TestingModule } from '@nestjs/testing';
import { GroupModule } from '../../../src/modules/groups/group.module';

describe('GroupModule', () => {
  let provider: GroupModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupModule],
    }).compile();

    provider = module.get<GroupModule>(GroupModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
