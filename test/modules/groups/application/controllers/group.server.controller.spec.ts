import { Test, TestingModule } from '@nestjs/testing';
import { GroupServerController } from '../../../../../src/modules/groups/application/controllers/group.server.controller';

describe('GroupServerController', () => {
  let provider: GroupServerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupServerController],
    }).compile();

    provider = module.get<GroupServerController>(GroupServerController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
