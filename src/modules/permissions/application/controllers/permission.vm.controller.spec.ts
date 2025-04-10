import { Test, TestingModule } from '@nestjs/testing';
import { PermissionVmController } from './permission.vm.controller';

describe('PermissionVmController', () => {
  let controller: PermissionVmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionVmController],
    }).compile();

    controller = module.get<PermissionVmController>(PermissionVmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
