import { RegisterUseCase } from '../register.use-case';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from '../../dto/register.dto';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { RegisterUserUseCase } from '@/modules/users/application/use-cases';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let registerUserUseCase: jest.Mocked<RegisterUserUseCase>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockDto: RegisterDto = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    username: 'john_doe',
    password: 'Password123!',
  };

  beforeEach(() => {
    registerUserUseCase = {
      execute: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_TOKEN_EXPIRATION':
            return '15m';
          case 'JWT_REFRESH_TOKEN_EXPIRATION':
            return '7d';
          default:
            return undefined;
        }
      }),
    } as any;

    useCase = new RegisterUseCase(
      registerUserUseCase,
      jwtService,
      configService,
    );
  });

  it('should register a new user and return access and refresh tokens', async () => {
    const fakeUser = createMockUser();
    registerUserUseCase.execute.mockResolvedValue(fakeUser);
    jwtService.sign
      .mockReturnValueOnce('access.jwt.token')
      .mockReturnValueOnce('refresh.jwt.token');

    const result = await useCase.execute(mockDto);

    expect(registerUserUseCase.execute).toHaveBeenCalledWith(mockDto);
    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        userId: fakeUser.id,
        email: fakeUser.email,
        isTwoFactorEnabled: fakeUser.isTwoFactorEnabled,
      },
      { expiresIn: '15m' },
    );
    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        userId: fakeUser.id,
        email: fakeUser.email,
        isTwoFactorEnabled: fakeUser.isTwoFactorEnabled,
      },
      { expiresIn: '7d' },
    );
    expect(result).toEqual({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });
  });
});
