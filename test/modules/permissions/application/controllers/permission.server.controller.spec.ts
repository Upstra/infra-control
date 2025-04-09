import { Test, TestingModule } from '@nestjs/testing';
import { PermissionServerController } from '../../../../src/modules/permissions/application/controllers/permission.server.controller';

describe('PermissionServerController', () => {
  let provider: PermissionServerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionServerController],
    }).compile();

    provider = module.get<PermissionServerController>(PermissionServerController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
