import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../use-cases/login.use-case';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { Get2FAStatusUseCase } from '../use-cases/get-2fa-status.use-case';
import { Generate2FAUseCase } from '../use-cases/generate-2fa.use-case';
import { Verify2FAUseCase } from '../use-cases/verify-2fa.use-case';
import { Disable2FAUseCase } from '../use-cases/disable-2fa.use-case';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const loginUseCase = { execute: jest.fn() };
  const registerUseCase = { execute: jest.fn() };
  const get2FAStatusUseCase = { execute: jest.fn() };
  const generate2FAUseCase = { execute: jest.fn() };
  const verify2FAUseCase = { execute: jest.fn() };
  const disable2FAUseCase = { execute: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: RegisterUseCase, useValue: registerUseCase },
        { provide: Get2FAStatusUseCase, useValue: get2FAStatusUseCase },
        { provide: Generate2FAUseCase, useValue: generate2FAUseCase },
        { provide: Verify2FAUseCase, useValue: verify2FAUseCase },
        { provide: Disable2FAUseCase, useValue: disable2FAUseCase },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should call login use case with dto', async () => {
    const dto: LoginDto = { identifier: 'john', password: 'pass' };
    await controller.login(dto);
    expect(loginUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('should call register use case with dto', async () => {
    const dto: RegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'Password123!',
    };
    await controller.register(dto);
    expect(registerUseCase.execute).toHaveBeenCalledWith(dto);
  });
});
