import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../../src/modules/users/application/controllers/user.controller';

describe('UserController', () => {
  let provider: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserController],
    }).compile();

    provider = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
