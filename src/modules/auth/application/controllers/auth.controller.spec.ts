import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../use-cases/login.use-case';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { Get2FAStatusUseCase } from '../use-cases/get-2fa-status.use-case';
import { Generate2FAUseCase } from '../use-cases/generate-2fa.use-case';
import { Verify2FAUseCase } from '../use-cases/verify-2fa.use-case';
import { Disable2FAUseCase } from '../use-cases/disable-2fa.use-case';
import { RenewTokenUseCase } from '../use-cases/renew-token.use-case';
import { ForgotPasswordUseCase } from '../use-cases/forgot-password.use-case';
import { ResetPasswordWithTokenUseCase } from '../use-cases/reset-password-with-token.use-case';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordWithTokenDto } from '../dto/reset-password-with-token.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const loginUseCase = { execute: jest.fn() };
  const registerUseCase = { execute: jest.fn() };
  const get2FAStatusUseCase = { execute: jest.fn() };
  const generate2FAUseCase = { execute: jest.fn() };
  const verify2FAUseCase = { execute: jest.fn() };
  const disable2FAUseCase = { execute: jest.fn() };
  const renewTokenUseCase = { execute: jest.fn() };
  const forgotPasswordUseCase = { execute: jest.fn() };
  const resetPasswordWithTokenUseCase = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: RegisterUseCase, useValue: registerUseCase },
        { provide: Get2FAStatusUseCase, useValue: get2FAStatusUseCase },
        { provide: Generate2FAUseCase, useValue: generate2FAUseCase },
        { provide: Verify2FAUseCase, useValue: verify2FAUseCase },
        { provide: Disable2FAUseCase, useValue: disable2FAUseCase },
        { provide: RenewTokenUseCase, useValue: renewTokenUseCase },
        { provide: ForgotPasswordUseCase, useValue: forgotPasswordUseCase },
        {
          provide: ResetPasswordWithTokenUseCase,
          useValue: resetPasswordWithTokenUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should call login use case with dto and set cookie for successful login without 2FA', async () => {
      const dto: LoginDto = { identifier: 'john', password: 'pass' };
      const res = { cookie: jest.fn() } as any;
      loginUseCase.execute.mockResolvedValue({
        accessToken: 'acc',
        refreshToken: 'ref',
      });

      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      const result = await controller.login(dto, res, mockReq);

      expect(loginUseCase.execute).toHaveBeenCalledWith(
        dto,
        expect.any(Object),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'ref',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/auth/refresh',
        }),
      );
      expect(result).toEqual({ accessToken: 'acc' });
    });

    it('should return 2FA response when 2FA is required', async () => {
      const dto: LoginDto = { identifier: 'john', password: 'pass' };
      const res = { cookie: jest.fn() } as any;
      const twoFAResponse = {
        requiresTwoFactor: true,
        twoFactorToken: '2fa-temp-token',
      };
      loginUseCase.execute.mockResolvedValue(twoFAResponse);

      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      const result = await controller.login(dto, res, mockReq);

      expect(loginUseCase.execute).toHaveBeenCalledWith(
        dto,
        expect.any(Object),
      );
      expect(res.cookie).not.toHaveBeenCalled();
      expect(result).toEqual(twoFAResponse);
    });

    it('should handle login failure', async () => {
      const dto: LoginDto = { identifier: 'john', password: 'wrongpass' };
      const res = { cookie: jest.fn() } as any;
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test-Agent'),
      } as any;
      const error = new Error('Invalid credentials');
      loginUseCase.execute.mockRejectedValue(error);

      await expect(controller.login(dto, res, mockReq)).rejects.toThrow(error);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  it('should call register use case with dto and set cookie', async () => {
    const dto: RegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'Password123!',
    };
    const res = { cookie: jest.fn() } as any;
    registerUseCase.execute.mockResolvedValue({
      accessToken: 'acc',
      refreshToken: 'ref',
    });

    const mockReq = {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test-Agent'),
    } as any;
    const result = await controller.register(dto, res, mockReq);

    expect(registerUseCase.execute).toHaveBeenCalledWith(
      dto,
      expect.any(Object),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'ref',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/auth/refresh',
      }),
    );
    expect(result).toEqual({ accessToken: 'acc' });
  });

  it('should call renew token use case with refreshToken from cookie', async () => {
    const mockReq = { cookies: { refreshToken: 'refresh.token' } } as any;
    const mockRes = { cookie: jest.fn() } as any;
    renewTokenUseCase.execute.mockReturnValue({
      accessToken: 'acc',
      refreshToken: 'newRef',
    });

    await controller.refresh(mockReq, mockRes);
    expect(renewTokenUseCase.execute).toHaveBeenCalledWith('refresh.token');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'newRef',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/auth/refresh',
      }),
    );
  });

  it('should throw UnauthorizedException when refresh token is missing', async () => {
    const mockReq = { cookies: {} } as any;
    const mockRes = { cookie: jest.fn() } as any;

    await expect(controller.refresh(mockReq, mockRes)).rejects.toThrow(
      'Refresh token not found',
    );
    expect(renewTokenUseCase.execute).not.toHaveBeenCalled();
  });

  describe('logout', () => {
    it('should clear refresh token cookie', async () => {
      const mockRes = { clearCookie: jest.fn() } as any;

      const result = await controller.logout(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/auth/refresh',
      });
      expect(result).toEqual({ message: 'Déconnexion réussie' });
    });
  });

  describe('forgotPassword', () => {
    it('should call forgot password use case with email', async () => {
      const dto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      forgotPasswordUseCase.execute.mockResolvedValue({
        message:
          'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
      });

      const result = await controller.forgotPassword(dto);

      expect(forgotPasswordUseCase.execute).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual({
        message:
          'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
      });
    });

    it('should handle forgot password errors gracefully', async () => {
      const dto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      forgotPasswordUseCase.execute.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.forgotPassword(dto)).rejects.toThrow(
        'Database error',
      );
      expect(forgotPasswordUseCase.execute).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('resetPasswordWithToken', () => {
    it('should call reset password with token use case successfully', async () => {
      const dto: ResetPasswordWithTokenDto = {
        token: 'valid-reset-token',
        newPassword: 'NewSecurePassword123!',
      };

      resetPasswordWithTokenUseCase.execute.mockResolvedValue({
        message: 'Votre mot de passe a été réinitialisé avec succès',
      });

      const result = await controller.resetPasswordWithToken(dto);

      expect(resetPasswordWithTokenUseCase.execute).toHaveBeenCalledWith(
        dto.token,
        dto.newPassword,
      );
      expect(result).toEqual({
        message: 'Votre mot de passe a été réinitialisé avec succès',
      });
    });

    it('should propagate UnauthorizedException for invalid token', async () => {
      const dto: ResetPasswordWithTokenDto = {
        token: 'invalid-token',
        newPassword: 'NewSecurePassword123!',
      };

      const error = new Error('Token de réinitialisation invalide');
      resetPasswordWithTokenUseCase.execute.mockRejectedValue(error);

      await expect(controller.resetPasswordWithToken(dto)).rejects.toThrow(
        error,
      );
      expect(resetPasswordWithTokenUseCase.execute).toHaveBeenCalledWith(
        dto.token,
        dto.newPassword,
      );
    });

    it('should propagate error for expired token', async () => {
      const dto: ResetPasswordWithTokenDto = {
        token: 'expired-token',
        newPassword: 'NewSecurePassword123!',
      };

      const error = new Error('Le token de réinitialisation a expiré');
      resetPasswordWithTokenUseCase.execute.mockRejectedValue(error);

      await expect(controller.resetPasswordWithToken(dto)).rejects.toThrow(
        error,
      );
      expect(resetPasswordWithTokenUseCase.execute).toHaveBeenCalledWith(
        dto.token,
        dto.newPassword,
      );
    });
  });
});
