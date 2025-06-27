import { RegisterUseCase } from '../register.use-case';
import { TokenService } from '../../services/token.service';
import { RegisterDto } from '../../dto/register.dto';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { RegisterUserUseCase } from '@/modules/users/application/use-cases';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let registerUserUseCase: jest.Mocked<RegisterUserUseCase>;
  let tokenService: jest.Mocked<TokenService>;

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

    tokenService = {
      generateTokens: jest.fn(),
    } as any;

    useCase = new RegisterUseCase(registerUserUseCase, tokenService);
  });

  it('should register a new user and return access and refresh tokens', async () => {
    const fakeUser = createMockUser();
    registerUserUseCase.execute.mockResolvedValue(fakeUser);
    tokenService.generateTokens.mockReturnValue({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });

    const result = await useCase.execute(mockDto);

    expect(registerUserUseCase.execute).toHaveBeenCalledWith(mockDto);
    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      userId: fakeUser.id,
      email: fakeUser.email,
      isTwoFactorEnabled: fakeUser.isTwoFactorEnabled,
    });
    expect(result).toEqual({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });
  });
});
