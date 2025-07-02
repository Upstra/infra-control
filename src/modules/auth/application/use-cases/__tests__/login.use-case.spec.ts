import { LoginUseCase } from '../login.use-case';
import { TokenService } from '../../services/token.service';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import {
  AuthNotFoundException,
  AuthPasswordNotValidException,
} from '@/modules/auth/domain/exceptions/auth.exception';
import { User } from '@/modules/users/domain/entities/user.entity';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import {
  GetUserByEmailUseCase,
  GetUserByUsernameUseCase,
} from '@/modules/users/application/use-cases';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let getUserByEmailUseCase: jest.Mocked<GetUserByEmailUseCase>;
  let getUserByUsernameUseCase: jest.Mocked<GetUserByUsernameUseCase>;
  let userDomain: jest.Mocked<UserDomainService>;
  let tokenService: jest.Mocked<TokenService>;

  const mockUser = (overrides?: Partial<User>): User =>
    Object.assign(new User(), {
      id: '123',
      email: 'test@example.com',
      username: 'tester',
      password: 'hashed',
      isTwoFactorEnabled: false,
      firstName: 'Test',
      lastName: 'User',
      twoFactorSecret: 'SOME_SECRET',
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [createMockRole()],
      ...overrides,
    });

  beforeEach(() => {
    getUserByEmailUseCase = { execute: jest.fn() } as any;
    getUserByUsernameUseCase = { execute: jest.fn() } as any;

    userDomain = {
      validatePassword: jest.fn(),
      isTwoFactorEnabled: jest.fn(),
    } as any;

    tokenService = {
      generateTokens: jest.fn(),
      generate2FAToken: jest.fn(),
    } as any;

    useCase = new LoginUseCase(
      getUserByUsernameUseCase,
      getUserByEmailUseCase,
      userDomain,
      tokenService,
    );
  });

  it('should return access and refresh tokens when login with valid email and 2FA is disabled', async () => {
    const user = mockUser();
    getUserByEmailUseCase.execute.mockResolvedValue(user);
    userDomain.validatePassword.mockResolvedValue(true);
    userDomain.isTwoFactorEnabled.mockReturnValue(false);
    tokenService.generateTokens.mockReturnValue({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });

    const result = await useCase.execute({
      identifier: 'test@example.com',
      password: '123456',
    });

    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
    expect(result).toEqual({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });
  });

  it('should return access and refresh tokens when login with valid username and 2FA is disabled', async () => {
    const user = mockUser();
    getUserByUsernameUseCase.execute.mockResolvedValue(user);
    userDomain.validatePassword.mockResolvedValue(true);
    userDomain.isTwoFactorEnabled.mockReturnValue(false);
    tokenService.generateTokens.mockReturnValue({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });

    const result = await useCase.execute({
      identifier: 'tester',
      password: '123456',
    });

    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
    expect(result).toEqual({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });
  });

  it('should return 2FA token when user has 2FA enabled', async () => {
    const user = mockUser({ isTwoFactorEnabled: true });
    getUserByEmailUseCase.execute.mockResolvedValue(user);
    userDomain.validatePassword.mockResolvedValue(true);
    userDomain.isTwoFactorEnabled.mockReturnValue(true);
    tokenService.generate2FAToken.mockReturnValue('2fa.jwt.token');

    const result = await useCase.execute({
      identifier: 'test@example.com',
      password: '123456',
    });

    expect(tokenService.generate2FAToken).toHaveBeenCalledWith({
      userId: user.id,
      step: '2fa',
      email: user.email,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
    expect(result).toEqual({
      requiresTwoFactor: true,
      twoFactorToken: '2fa.jwt.token',
    });
  });

  it('should throw AuthNotFoundException if user not found by email', async () => {
    getUserByEmailUseCase.execute.mockResolvedValue(null);

    await expect(
      useCase.execute({
        identifier: 'unknown@example.com',
        password: '123456',
      }),
    ).rejects.toThrow(AuthNotFoundException);
  });

  it('should throw AuthNotFoundException if user not found by username', async () => {
    getUserByUsernameUseCase.execute.mockResolvedValue(null);

    await expect(
      useCase.execute({
        identifier: 'unknownuser',
        password: '123456',
      }),
    ).rejects.toThrow(AuthNotFoundException);
  });

  it('should throw AuthPasswordNotValidException if password is invalid', async () => {
    const user = mockUser();
    getUserByEmailUseCase.execute.mockResolvedValue(user);
    userDomain.validatePassword.mockResolvedValue(false);

    await expect(
      useCase.execute({ identifier: 'test@example.com', password: 'wrong' }),
    ).rejects.toThrow(AuthPasswordNotValidException);
  });
});
