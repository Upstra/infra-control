import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../../services/token.service';
import { Verify2FARecoveryUseCase } from '../verify-2fa-recovery.use-case';
import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';
import { TwoFARecoveryDto } from '../../dto/twofa.dto';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';

import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('Verify2FARecoveryUseCase', () => {
  let useCase: Verify2FARecoveryUseCase;
  let getUserByEmailUseCase: jest.Mocked<GetUserByEmailUseCase>;
  let updateUserFieldsUseCase: jest.Mocked<UpdateUserFieldsUseCase>;
  let jwtService: jest.Mocked<JwtService>;
  let tokenService: jest.Mocked<TokenService>;

  const userPayload = createMockJwtPayload();

  const dto: TwoFARecoveryDto = {
    recoveryCode: 'VALID-CODE',
  };

  beforeEach(() => {
    getUserByEmailUseCase = { execute: jest.fn() } as any;
    updateUserFieldsUseCase = { execute: jest.fn() } as any;
    jwtService = { sign: jest.fn() } as any;
    tokenService = { generate2FAToken: jest.fn() } as any;

    useCase = new Verify2FARecoveryUseCase(
      getUserByEmailUseCase,
      updateUserFieldsUseCase,
      jwtService,
      tokenService,
    );
  });

  it('should succeed if a recovery code matches and return a token', async () => {
    const mockUser = createMockUser({
      recoveryCodes: ['hashed-code-1', 'hashed-code-2'],
    });

    getUserByEmailUseCase.execute.mockResolvedValue(mockUser);

    (bcrypt.compare as jest.Mock).mockImplementation((code, hash) => {
      return Promise.resolve(hash === 'hashed-code-2');
    });

    tokenService.generate2FAToken.mockReturnValue('valid.jwt.token');

    const result = await useCase.execute(userPayload, dto);

    expect(tokenService.generate2FAToken).toHaveBeenCalledWith({
      userId: mockUser.id,
      email: mockUser.email,
      isTwoFactorAuthenticated: true,
      isActive: mockUser.isActive,
      roles: mockUser.roles,
    });
    expect(result).toEqual({
      isValid: true,
      accessToken: 'valid.jwt.token',
      message: 'Connexion via recovery code réussie.',
    });

    expect(updateUserFieldsUseCase.execute).toHaveBeenCalledWith(mockUser.id, {
      recoveryCodes: ['hashed-code-1'],
    });
  });

  it('should throw if no matching code found', async () => {
    const mockUser = createMockUser({
      recoveryCodes: ['code-a', 'code-b'],
    });

    getUserByEmailUseCase.execute.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(useCase.execute(userPayload, dto)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw if no recovery codes are set', async () => {
    const mockUser = createMockUser({ recoveryCodes: [] });
    getUserByEmailUseCase.execute.mockResolvedValue(mockUser);

    await expect(useCase.execute(userPayload, dto)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw if user is not found', async () => {
    getUserByEmailUseCase.execute.mockResolvedValue(null);

    await expect(useCase.execute(userPayload, dto)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
