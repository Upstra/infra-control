import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../../../src/modules/auth/application/services/auth.service";
import { AuthController } from "../../../src/modules/auth/auth.controller";


describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
