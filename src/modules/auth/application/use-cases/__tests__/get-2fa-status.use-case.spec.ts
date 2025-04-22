import { Get2FAStatusUseCase } from '../get-2fa-status.use-case';
import { UserService } from '@/modules/users/application/services/user.service';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';

describe('Get2FAStatusUseCase', () => {
    let useCase: Get2FAStatusUseCase;
    let userService: jest.Mocked<UserService>;

    beforeEach(() => {
        userService = {
            findRawByEmail: jest.fn(),
        } as any;

        useCase = new Get2FAStatusUseCase(userService);
    });

    it('should return true if 2FA is enabled', async () => {
        const user = createMockUser({ isTwoFactorEnabled: true });
        userService.findRawByEmail.mockResolvedValue(user);

        const result = await useCase.execute(user.email);

        expect(result).toEqual({ isTwoFactorEnabled: true });
    });

    it('should return false if 2FA is disabled', async () => {
        const user = createMockUser({ isTwoFactorEnabled: false });
        userService.findRawByEmail.mockResolvedValue(user);

        const result = await useCase.execute(user.email);

        expect(result).toEqual({ isTwoFactorEnabled: false });
    });

    it('should return false if user is not found', async () => {
        userService.findRawByEmail.mockResolvedValue(null);

        const result = await useCase.execute('nonexistent@example.com');

        expect(result).toEqual({ isTwoFactorEnabled: false });
    });
});
