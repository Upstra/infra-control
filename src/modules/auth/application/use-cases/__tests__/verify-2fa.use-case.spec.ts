import { Verify2FAUseCase } from '../verify-2fa.use-case';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../services/token.service';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.exception';
import { TwoFAInvalidCodeException } from '@/modules/auth/domain/exceptions/twofa.exception';
import { TwoFADto } from '../../dto/twofa.dto';
import * as speakeasy from 'speakeasy';
import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';

jest.mock('speakeasy');

describe('Verify2FAUseCase', () => {
  let useCase: Verify2FAUseCase;
  let getUserByEmailUseCase: jest.Mocked<GetUserByEmailUseCase>;
  let updateUserFieldsUseCase: jest.Mocked<UpdateUserFieldsUseCase>;
  let jwtService: jest.Mocked<JwtService>;
  let tokenService: jest.Mocked<TokenService>;

  const userPayload = createMockJwtPayload();

  const dto: TwoFADto = {
    code: '123456',
  };

  beforeEach(() => {
    getUserByEmailUseCase = {
      execute: jest.fn(),
    } as any;

    updateUserFieldsUseCase = {
      execute: jest.fn(),
    } as any;

    jwtService = { sign: jest.fn() } as any;
    tokenService = { 
      generate2FAToken: jest.fn(),
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'mocked-access-token',
        refreshToken: 'mocked-refresh-token',
      }),
    } as any;

    const recoverCodeService = {
      generate: jest.fn().mockReturnValue(['code1', 'code2', 'code3']),
      hash: jest.fn().mockResolvedValue(['hashed1', 'hashed2', 'hashed3']),
    } as any;

    useCase = new Verify2FAUseCase(
      getUserByEmailUseCase,
      updateUserFieldsUseCase,
      recoverCodeService,
      jwtService,
      tokenService,
    );
  });

  it('should return an access token if code is valid and 2FA is already enabled', async () => {
    const user = createMockUser({ isTwoFactorEnabled: true });
    getUserByEmailUseCase.execute.mockResolvedValue(user);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

    const result = await useCase.execute(userPayload, dto);

    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      isActive: user.isActive,
      roles: user.roles,
    });
    expect(result).toEqual({
      isValid: true,
      accessToken: 'mocked-access-token',
      message: '2FA verified successfully.',
      refreshToken: 'mocked-refresh-token',
    });
    expect(updateUserFieldsUseCase.execute).not.toHaveBeenCalled();
  });

  it('should enable 2FA and return token if code is valid and 2FA is not enabled', async () => {
    const user = createMockUser({ isTwoFactorEnabled: false });
    getUserByEmailUseCase.execute.mockResolvedValue(user);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

    const result = await useCase.execute(userPayload, dto);

    expect(updateUserFieldsUseCase.execute).toHaveBeenCalledWith(user.id, {
      isTwoFactorEnabled: true,
      recoveryCodes: expect.any(Array),
    });
    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      isActive: user.isActive,
      roles: user.roles,
    });
    expect(result).toEqual({
      isValid: true,
      accessToken: 'mocked-access-token',
      message:
        '2FA activated successfully. Store your recovery codes securely.',
      recoveryCodes: expect.any(Array),
      refreshToken: 'mocked-refresh-token',
    });
  });

  it('should throw UserNotFoundException if user not found', async () => {
    getUserByEmailUseCase.execute.mockResolvedValue(null);

    await expect(useCase.execute(userPayload, dto)).rejects.toThrow(
      UserNotFoundException,
    );
  });

  it('should throw TwoFAInvalidCodeException if code is invalid', async () => {
    const user = createMockUser();
    getUserByEmailUseCase.execute.mockResolvedValue(user);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

    await expect(useCase.execute(userPayload, dto)).rejects.toThrow(
      TwoFAInvalidCodeException,
    );
  });
});
