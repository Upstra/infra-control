import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { Get2FAStatusUseCase } from '../application/use-cases/get-2fa-status.use-case';
import { Generate2FAUseCase } from '../application/use-cases/generate-2fa.use-case';
import { Verify2FAUseCase } from '../application/use-cases/verify-2fa.use-case';
import { Disable2FAUseCase } from '../application/use-cases/disable-2fa.use-case';
import { LoginDto } from '../application/dto/login.dto';
import { RegisterDto } from '../application/dto/register.dto';
import { TwoFADto } from '../application/dto/twofa.dto';

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

  it('should call get2FAStatus with user email', async () => {
    const mockUser = { email: 'john@example.com', userId: 'id123' };
    await controller.get2FAStatus(mockUser);
    expect(get2FAStatusUseCase.execute).toHaveBeenCalledWith(
      'john@example.com',
    );
  });

  it('should call generate 2FA with email', async () => {
    const mockUser = { email: 'john@example.com', userId: 'id123' };
    await controller.generate(mockUser);
    expect(generate2FAUseCase.execute).toHaveBeenCalledWith('john@example.com');
  });

  it('should call verify 2FA with payload and dto', async () => {
    const user = { email: 'john@example.com', userId: 'id123' };
    const dto: TwoFADto = { code: '123456' };
    await controller.verify(user, dto);
    expect(verify2FAUseCase.execute).toHaveBeenCalledWith(user, dto);
  });

  it('should call disable 2FA with payload and dto', async () => {
    const user = { email: 'john@example.com', userId: 'id123' };
    const dto: TwoFADto = { code: '123456' };
    await controller.disable(user, dto);
    expect(disable2FAUseCase.execute).toHaveBeenCalledWith(user, dto);
  });
});
