import { Generate2FAUseCase } from '../generate-2fa.use-case';
import { UserService } from '@/modules/users/application/services/user.service';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.notfound.exception';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

jest.mock('speakeasy');
jest.mock('qrcode');

describe('Generate2FAUseCase', () => {
  let useCase: Generate2FAUseCase;
  let userService: jest.Mocked<UserService>;

  beforeEach(() => {
    userService = {
      findRawByEmail: jest.fn(),
      updateUserFields: jest.fn(),
    } as any;

    useCase = new Generate2FAUseCase(userService);
  });

  it('should generate a secret and QR code if user exists', async () => {
    const mockUser = createMockUser();
    userService.findRawByEmail.mockResolvedValue(mockUser);

    (speakeasy.generateSecret as jest.Mock).mockReturnValue({
      base32: 'MOCK_SECRET',
      otpauth_url: 'otpauth://totp/InfraControl',
    });

    (qrcode.toDataURL as jest.Mock).mockResolvedValue(
      'data:image/png;base64,qrcode',
    );

    const result = await useCase.execute(mockUser.email);

    expect(userService.findRawByEmail).toHaveBeenCalledWith(mockUser.email);
    expect(userService.updateUserFields).toHaveBeenCalledWith(mockUser.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: 'MOCK_SECRET',
    });

    expect(result.setupKey).toBe('MOCK_SECRET');
    expect(result.qrCode).toBe('data:image/png;base64,qrcode');
  });

  it('should throw UserNotFoundException if user does not exist', async () => {
    userService.findRawByEmail.mockResolvedValue(null);

    await expect(useCase.execute('notfound@mail.com')).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
