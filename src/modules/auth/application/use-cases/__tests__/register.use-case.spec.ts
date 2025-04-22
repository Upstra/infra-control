import { RegisterUseCase } from '../register.use-case';
import { UserService } from '@/modules/users/application/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../../dto/register.dto';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';

describe('RegisterUseCase', () => {
    let useCase: RegisterUseCase;
    let userService: jest.Mocked<UserService>;
    let jwtService: jest.Mocked<JwtService>;

    const mockDto: RegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'Password123!',
    };

    beforeEach(() => {
        userService = {
            registerWithDefaultRole: jest.fn(),
        } as any;

        jwtService = {
            sign: jest.fn(),
        } as any;

        useCase = new RegisterUseCase(userService, jwtService);
    });

    it('should register a new user and return an access token', async () => {
        const fakeUser = createMockUser();
        userService.registerWithDefaultRole.mockResolvedValue(fakeUser);
        jwtService.sign.mockReturnValue('mock.jwt.token');

        const result = await useCase.execute(mockDto);

        expect(userService.registerWithDefaultRole).toHaveBeenCalledWith(mockDto);
        expect(jwtService.sign).toHaveBeenCalledWith({ userId: fakeUser.id });
        expect(result).toEqual({ accessToken: 'mock.jwt.token' });
    });
});
