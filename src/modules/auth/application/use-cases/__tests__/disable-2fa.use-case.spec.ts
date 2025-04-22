import { Disable2FAUseCase } from '../disable-2fa.use-case';
import { UserService } from '@/modules/users/application/services/user.service';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { TwoFADto } from '../../dto/twofa.dto';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.notfound.exception';
import * as speakeasy from 'speakeasy';

jest.mock('speakeasy');

describe('Disable2FAUseCase', () => {
    let useCase: Disable2FAUseCase;
    let userService: jest.Mocked<UserService>;

    const mockPayload: JwtPayload = {
        userId: 'user-123',
        email: 'john.doe@example.com',
    };

    const dto: TwoFADto = { code: '123456' };

    beforeEach(() => {
        userService = {
            findRawByEmail: jest.fn(),
            updateUserFields: jest.fn(),
        } as any;

        useCase = new Disable2FAUseCase(userService);
    });

    it('should disable 2FA if code is valid', async () => {
        const mockUser = createMockUser({ isTwoFactorEnabled: true });
        userService.findRawByEmail.mockResolvedValue(mockUser);
        (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

        const result = await useCase.execute(mockPayload, dto);

        expect(userService.updateUserFields).toHaveBeenCalledWith(mockUser.id, {
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
        userService.findRawByEmail.mockResolvedValue(mockUser);
        (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

        const result = await useCase.execute(mockPayload, dto);

        expect(userService.updateUserFields).not.toHaveBeenCalled();
        expect(result).toEqual({
            isDisabled: false,
            message: 'Invalid code. 2FA is still active.',
        });
    });

    it('should throw UserNotFoundException if user is not found', async () => {
        userService.findRawByEmail.mockResolvedValue(null);

        await expect(useCase.execute(mockPayload, dto)).rejects.toThrow(
            UserNotFoundException,
        );
    });
});
