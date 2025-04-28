import { Test, TestingModule } from '@nestjs/testing';
import { GroupVmController } from '../group.vm.controller';

describe('GroupVmController', () => {
  let controller: GroupVmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupVmController],
    }).compile();

    controller = module.get<GroupVmController>(GroupVmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
