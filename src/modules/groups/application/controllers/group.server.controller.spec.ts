import { Test, TestingModule } from '@nestjs/testing';
import { GroupServerController } from './group.server.controller';

describe('GroupServerController', () => {
  let controller: GroupServerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupServerController],
    }).compile();

    controller = module.get<GroupServerController>(GroupServerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
