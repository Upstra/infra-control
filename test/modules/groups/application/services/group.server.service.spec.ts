import { Test, TestingModule } from '@nestjs/testing';
import { GroupServerService } from '../../../../../src/modules/groups/application/services/group.server.service';

describe('GroupServerService', () => {
  let provider: GroupServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupServerService],
    }).compile();

    provider = module.get<GroupServerService>(GroupServerService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
