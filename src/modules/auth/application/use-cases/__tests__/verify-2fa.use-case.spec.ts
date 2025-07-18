import { Verify2FAUseCase } from '../verify-2fa.use-case';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../services/token.service';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.exception';
import { TwoFAInvalidCodeException } from '@/modules/auth/domain/exceptions/twofa.exception';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
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

  const userPayload: JwtPayload = {
    userId: 'user-123',
    email: 'john.doe@example.com',
  };

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
    tokenService = { generate2FAToken: jest.fn() } as any;

    const recoverCodeService = {
      generate: jest.fn(),
      hash: jest.fn(),
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
    tokenService.generate2FAToken.mockReturnValue('access.token');

    const result = await useCase.execute(userPayload, dto);

    expect(tokenService.generate2FAToken).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      isTwoFactorAuthenticated: true,
      isActive: user.isActive,
      roles: user.roles,
    });
    expect(result).toEqual({
      isValid: true,
      accessToken: 'access.token',
      message: '2FA verified successfully.',
    });
    expect(updateUserFieldsUseCase.execute).not.toHaveBeenCalled();
  });

  it('should enable 2FA and return token if code is valid and 2FA is not enabled', async () => {
    const user = createMockUser({ isTwoFactorEnabled: false });
    getUserByEmailUseCase.execute.mockResolvedValue(user);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
    tokenService.generate2FAToken.mockReturnValue('enabled.token');

    const result = await useCase.execute(userPayload, dto);

    expect(updateUserFieldsUseCase.execute).toHaveBeenCalledWith(user.id, {
      isTwoFactorEnabled: true,
    });
    expect(tokenService.generate2FAToken).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      isTwoFactorAuthenticated: true,
      isActive: user.isActive,
      roles: user.roles,
    });
    expect(result).toEqual({
      isValid: true,
      accessToken: 'enabled.token',
      message:
        '2FA activated successfully. Store your recovery codes securely.',
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
