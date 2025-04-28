import { Disable2FAUseCase } from '../disable-2fa.use-case';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TwoFADto } from '../../dto/twofa.dto';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.exception';
import * as speakeasy from 'speakeasy';
import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';

jest.mock('speakeasy');

describe('Disable2FAUseCase', () => {
  let useCase: Disable2FAUseCase;
  let getUserByEmailUseCase: jest.Mocked<GetUserByEmailUseCase>;
  let updateUserFieldsUseCase: jest.Mocked<UpdateUserFieldsUseCase>;

  const mockPayload: JwtPayload = {
    userId: 'user-123',
    email: 'john.doe@example.com',
  };

  const dto: TwoFADto = { code: '123456' };

  beforeEach(() => {
    getUserByEmailUseCase = {
      execute: jest.fn(),
    } as any;

    updateUserFieldsUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new Disable2FAUseCase(
      getUserByEmailUseCase,
      updateUserFieldsUseCase,
    );
  });

  it('should disable 2FA if code is valid', async () => {
    const mockUser = createMockUser({ isTwoFactorEnabled: true });
    getUserByEmailUseCase.execute.mockResolvedValue(mockUser);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

    const result = await useCase.execute(mockPayload, dto);

    expect(updateUserFieldsUseCase.execute).toHaveBeenCalledWith(mockUser.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    });

    expect(result).toEqual({
      isDisabled: true,
      message: '2FA has been disabled successfully.',
    });
  });

  it('should not disable 2FA if code is invalid', async () => {
    const mockUser = createMockUser({ isTwoFactorEnabled: true });
    getUserByEmailUseCase.execute.mockResolvedValue(mockUser);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

    const result = await useCase.execute(mockPayload, dto);

    expect(updateUserFieldsUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      isDisabled: false,
      message: 'Invalid code. 2FA is still active.',
    });
  });

  it('should throw UserNotFoundException if user is not found', async () => {
    getUserByEmailUseCase.execute.mockResolvedValue(null);

    await expect(useCase.execute(mockPayload, dto)).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
