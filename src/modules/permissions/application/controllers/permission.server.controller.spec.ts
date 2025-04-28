import { Test, TestingModule } from '@nestjs/testing';
import { PermissionServerController } from './permission.server.controller';

describe('PermissionServerController', () => {
  let controller: PermissionServerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionServerController],
    }).compile();

    controller = module.get<PermissionServerController>(
      PermissionServerController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
