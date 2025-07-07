import { Generate2FAUseCase } from '../generate-2fa.use-case';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import {
  UserExceptions,
  UserNotFoundException,
} from '@/modules/users/domain/exceptions/user.exception';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import {
  GetUserByEmailUseCase,
  UpdateUserFieldsUseCase,
} from '@/modules/users/application/use-cases';

jest.mock('speakeasy');
jest.mock('qrcode');

describe('Generate2FAUseCase', () => {
  let useCase: Generate2FAUseCase;
  let getUserByEmailUseCase: jest.Mocked<GetUserByEmailUseCase>;
  let updateUserFieldsUseCase: jest.Mocked<UpdateUserFieldsUseCase>;

  beforeEach(() => {
    getUserByEmailUseCase = {
      execute: jest.fn(),
    } as any;

    updateUserFieldsUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new Generate2FAUseCase(
      getUserByEmailUseCase,
      updateUserFieldsUseCase,
    );
  });

  it('should generate a secret and QR code if user exists', async () => {
    const mockUser = createMockUser();
    getUserByEmailUseCase.execute.mockResolvedValue(mockUser);

    (speakeasy.generateSecret as jest.Mock).mockReturnValue({
      base32: 'MOCK_SECRET',
      otpauth_url: 'otpauth://totp/InfraControl',
    });

    (qrcode.toDataURL as jest.Mock).mockResolvedValue(
      'data:image/png;base64,qrcode',
    );

    const result = await useCase.execute(mockUser.email);

    expect(getUserByEmailUseCase.execute).toHaveBeenCalledWith(mockUser.email);
    expect(updateUserFieldsUseCase.execute).toHaveBeenCalledWith(mockUser.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: 'MOCK_SECRET',
    });

    expect(result.setupKey).toBe('MOCK_SECRET');
    expect(result.qrCode).toBe('data:image/png;base64,qrcode');
  });

  it('should throw UserNotFoundException if user does not exist', async () => {
    getUserByEmailUseCase.execute.mockRejectedValue(
      UserExceptions.notFound('notfound@mail.com'),
    );

    await expect(useCase.execute('notfound@mail.com')).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
