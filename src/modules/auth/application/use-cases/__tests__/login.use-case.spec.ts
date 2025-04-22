import { LoginUseCase } from '../login.use-case';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/modules/users/application/services/user.service';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import {
  AuthNotFoundException,
  AuthPasswordNotValidException,
} from '@/modules/auth/domain/exceptions/auth.exception';
import { User } from '@/modules/users/domain/entities/user.entity';
import { createMockRole } from '@/modules/auth/__mocks__/role.mock';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userService: jest.Mocked<UserService>;
  let userDomain: jest.Mocked<UserDomainService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = (overrides?: Partial<User>): User => {
    return Object.assign(new User(), {
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
      role: createMockRole(),
      roleId: '1',
      ...overrides,
    });
  };

  beforeEach(() => {
    userService = {
      findRawByEmail: jest.fn(),
      findRawByUsername: jest.fn(),
    } as any;

    userDomain = {
      validatePassword: jest.fn(),
      isTwoFactorEnabled: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn(),
    } as any;

    useCase = new LoginUseCase(userService, userDomain, jwtService);
  });

  it('should return accessToken when login with valid email and 2FA is disabled', async () => {
    userService.findRawByEmail.mockResolvedValue(mockUser());
    userDomain.validatePassword.mockResolvedValue(true);
    userDomain.isTwoFactorEnabled.mockReturnValue(false);
    jwtService.sign.mockReturnValue('valid.jwt.token');

    const result = await useCase.execute({
      identifier: 'test@example.com',
      password: '123456',
    });

    expect(result).toEqual({ accessToken: 'valid.jwt.token' });
  });

  it('should return accessToken when login with valid username and 2FA is disabled', async () => {
    userService.findRawByUsername.mockResolvedValue(mockUser());
    userDomain.validatePassword.mockResolvedValue(true);
    userDomain.isTwoFactorEnabled.mockReturnValue(false);
    jwtService.sign.mockReturnValue('valid.jwt.token');

    const result = await useCase.execute({
      identifier: 'tester',
      password: '123456',
    });

    expect(result).toEqual({ accessToken: 'valid.jwt.token' });
  });

  it('should return 2FA token when user has 2FA enabled', async () => {
    userService.findRawByEmail.mockResolvedValue(
      mockUser({ isTwoFactorEnabled: true }),
    );

    userDomain.validatePassword.mockResolvedValue(true);
    userDomain.isTwoFactorEnabled.mockReturnValue(true);
    jwtService.sign.mockReturnValue('2fa.jwt.token');

    const result = await useCase.execute({
      identifier: 'test@example.com',
      password: '123456',
    });

    expect(result).toEqual({
      requiresTwoFactor: true,
      twoFactorToken: '2fa.jwt.token',
    });
  });

  it('should throw AuthNotFoundException if user not found', async () => {
    userService.findRawByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        identifier: 'unknown@example.com',
        password: '123456',
      }),
    ).rejects.toThrow(AuthNotFoundException);
  });

  it('should throw AuthPasswordNotValidException if password is invalid', async () => {
    userService.findRawByEmail.mockResolvedValue(mockUser());
    userDomain.validatePassword.mockResolvedValue(false);

    await expect(
      useCase.execute({ identifier: 'test@example.com', password: 'wrong' }),
    ).rejects.toThrow(AuthPasswordNotValidException);
  });
});
