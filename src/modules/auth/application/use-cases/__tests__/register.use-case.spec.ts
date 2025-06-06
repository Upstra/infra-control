import { RegisterUseCase } from '../register.use-case';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../../dto/register.dto';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { RegisterUserUseCase } from '@/modules/users/application/use-cases';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let registerUserUseCase: jest.Mocked<RegisterUserUseCase>;
  let jwtService: jest.Mocked<JwtService>;

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

    useCase = new RegisterUseCase(registerUserUseCase, jwtService);
  });

  it('should register a new user and return an access token', async () => {
    const fakeUser = createMockUser();
    registerUserUseCase.execute.mockResolvedValue(fakeUser);
    jwtService.sign.mockReturnValue('mock.jwt.token');

    const result = await useCase.execute(mockDto);

    expect(registerUserUseCase.execute).toHaveBeenCalledWith(mockDto);
    expect(jwtService.sign).toHaveBeenCalledWith({
      email: fakeUser.email,
      isTwoFactorEnabled: fakeUser.isTwoFactorEnabled,
      userId: fakeUser.id,
    });
    expect(result).toEqual({ accessToken: 'mock.jwt.token' });
  });
});
