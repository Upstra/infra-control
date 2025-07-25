import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegisterUseCase } from '../register.use-case';
import { TokenService } from '../../services/token.service';
import { RegisterDto } from '../../dto/register.dto';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { RegisterUserUseCase } from '@/modules/users/application/use-cases';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { RequestContextDto } from '@/core/dto';
import { EmailEventType } from '@/modules/email/domain/events/email.events';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let registerUserUseCase: jest.Mocked<RegisterUserUseCase>;
  let tokenService: jest.Mocked<TokenService>;
  let logHistory: jest.Mocked<LogHistoryUseCase>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

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

    logHistory = {
      execute: jest.fn(),
      executeStructured: jest.fn(),
    } as any;

    eventEmitter = {
      emit: jest.fn(),
    } as any;

    useCase = new RegisterUseCase(
      registerUserUseCase,
      tokenService,
      eventEmitter,
      logHistory,
    );
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
      isActive: fakeUser.isActive,
      roles: fakeUser.roles,
    });
    expect(result).toEqual({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EmailEventType.ACCOUNT_CREATED,
      {
        email: mockDto.email,
        firstname: mockDto.firstName,
      },
    );
  });

  it('should use username when firstName is not provided', async () => {
    const fakeUser = createMockUser();
    const dtoWithoutFirstName = { ...mockDto, firstName: undefined };

    registerUserUseCase.execute.mockResolvedValue(fakeUser);
    tokenService.generateTokens.mockReturnValue({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });

    await useCase.execute(dtoWithoutFirstName);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EmailEventType.ACCOUNT_CREATED,
      {
        email: dtoWithoutFirstName.email,
        firstname: fakeUser.username,
      },
    );
  });

  describe('Structured Logging', () => {
    const requestContext = RequestContextDto.forTesting({
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0 (Test)',
    });

    it('should log successful registration with structured data', async () => {
      const fakeUser = createMockUser();
      registerUserUseCase.execute.mockResolvedValue(fakeUser);
      tokenService.generateTokens.mockReturnValue({
        accessToken: 'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
      });

      await useCase.execute(mockDto, requestContext);

      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'auth',
        entityId: fakeUser.id,
        action: 'REGISTER_SUCCESS',
        userId: fakeUser.id,
        metadata: {
          registrationMethod: 'email',
          userEmail: fakeUser.email,
          userName: fakeUser.username,
          hasInitialRoles: fakeUser.roles?.length > 0,
        },
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0 (Test)',
      });
    });

    it('should work without request context', async () => {
      const fakeUser = createMockUser();
      registerUserUseCase.execute.mockResolvedValue(fakeUser);
      tokenService.generateTokens.mockReturnValue({
        accessToken: 'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
      });

      await useCase.execute(mockDto);

      expect(logHistory.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: undefined,
          userAgent: undefined,
        }),
      );
    });
  });

  it('should work without logHistory service', async () => {
    const fakeUser = createMockUser();
    registerUserUseCase.execute.mockResolvedValue(fakeUser);
    tokenService.generateTokens.mockReturnValue({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });

    const useCaseWithoutHistory = new RegisterUseCase(
      registerUserUseCase,
      tokenService,
      eventEmitter,
    );

    const result = await useCaseWithoutHistory.execute(mockDto);

    expect(result).toEqual({
      accessToken: 'access.jwt.token',
      refreshToken: 'refresh.jwt.token',
    });
  });
});
