import { Verify2FAUseCase } from '../verify-2fa.use-case';
import { JwtService } from '@nestjs/jwt';
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

    jwtService = {
      sign: jest.fn(),
    } as any;

    useCase = new Verify2FAUseCase(
      getUserByEmailUseCase,
      updateUserFieldsUseCase,
      jwtService,
    );
  });

  it('should return an access token if code is valid and 2FA is already enabled', async () => {
    const user = createMockUser({ isTwoFactorEnabled: true });
    getUserByEmailUseCase.execute.mockResolvedValue(user);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
    jwtService.sign.mockReturnValue('access.token');

    const result = await useCase.execute(userPayload, dto);

    expect(result).toEqual({ isValid: true, accessToken: 'access.token' });
    expect(updateUserFieldsUseCase.execute).not.toHaveBeenCalled();
  });

  it('should enable 2FA and return token if code is valid and 2FA is not enabled', async () => {
    const user = createMockUser({ isTwoFactorEnabled: false });
    getUserByEmailUseCase.execute.mockResolvedValue(user);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
    jwtService.sign.mockReturnValue('enabled.token');

    const result = await useCase.execute(userPayload, dto);

    expect(updateUserFieldsUseCase.execute).toHaveBeenCalledWith(user.id, {
      isTwoFactorEnabled: true,
    });
    expect(result).toEqual({ isValid: true, accessToken: 'enabled.token' });
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
