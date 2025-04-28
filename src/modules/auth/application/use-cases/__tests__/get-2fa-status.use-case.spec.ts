import { Get2FAStatusUseCase } from '../get-2fa-status.use-case';
import { GetUserByEmailUseCase } from '@/modules/users/application/use-cases';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';

describe('Get2FAStatusUseCase', () => {
  let useCase: Get2FAStatusUseCase;
  let getUserByEmailUseCase: jest.Mocked<GetUserByEmailUseCase>;

  beforeEach(() => {
    getUserByEmailUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new Get2FAStatusUseCase(getUserByEmailUseCase);
  });

  it('should return true if 2FA is enabled', async () => {
    const user = createMockUser({ isTwoFactorEnabled: true });
    getUserByEmailUseCase.execute.mockResolvedValue(user);

    const result = await useCase.execute(user.email);

    expect(result).toEqual({ isTwoFactorEnabled: true });
  });

  it('should return false if 2FA is disabled', async () => {
    const user = createMockUser({ isTwoFactorEnabled: false });
    getUserByEmailUseCase.execute.mockResolvedValue(user);

    const result = await useCase.execute(user.email);

    expect(result).toEqual({ isTwoFactorEnabled: false });
  });

  it('should return false if user is not found', async () => {
    getUserByEmailUseCase.execute.mockResolvedValue(null);

    const result = await useCase.execute('nonexistent@example.com');

    expect(result).toEqual({ isTwoFactorEnabled: false });
  });
});
