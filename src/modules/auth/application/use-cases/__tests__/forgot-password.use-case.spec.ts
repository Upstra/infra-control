import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForgotPasswordUseCase } from '../forgot-password.use-case';
import { UserRepositoryInterface } from '../../../../users/domain/interfaces/user.repository.interface';
import { User } from '../../../../users/domain/entities/user.entity';
import { EmailEventType } from '../../../../email/domain/events/email.events';
import { LogHistoryUseCase } from '../../../../history/application/use-cases/log-history.use-case';

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;

  const mockUser: Partial<User> = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    isActive: true,
    isVerified: true,
    isTwoFactorEnabled: false,
    twoFactorSecret: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForgotPasswordUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            executeStructured: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ForgotPasswordUseCase>(ForgotPasswordUseCase);
    userRepository = module.get('UserRepositoryInterface');
    eventEmitter = module.get(EventEmitter2);
    logHistoryUseCase = module.get(LogHistoryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const email = 'test@example.com';

    it('should generate reset token and send email when user exists', async () => {
      userRepository.findOneByField.mockResolvedValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);

      const result = await useCase.execute(email);

      expect(userRepository.findOneByField).toHaveBeenCalledWith({
        field: 'email',
        value: email,
        disableThrow: true,
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: expect.any(String),
          resetPasswordExpiry: expect.any(Date),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.PASSWORD_RESET,
        expect.objectContaining({
          email: email,
          firstName: mockUser.firstName,
          resetLink: expect.stringContaining('reset-password?token='),
        }),
      );
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledTimes(2);
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'user',
        entityId: mockUser.id,
        action: 'PASSWORD_RESET_REQUESTED',
        userId: mockUser.id,
        metadata: {
          email: mockUser.email,
          timestamp: expect.any(String),
        },
      });
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_ATTEMPT',
          metadata: expect.objectContaining({
            attemptType: 'new_token_generated',
          }),
        }),
      );
      expect(result).toEqual({
        message:
          'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
      });
    });

    it('should return generic message when user does not exist', async () => {
      userRepository.findOneByField.mockResolvedValue(null);

      const result = await useCase.execute(email);

      expect(userRepository.findOneByField).toHaveBeenCalledWith({
        field: 'email',
        value: email,
        disableThrow: true,
      });
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
      expect(result).toEqual({
        message:
          'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
      });
    });

    it('should return generic message on error', async () => {
      userRepository.findOneByField.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await useCase.execute(email);

      expect(result).toEqual({
        message:
          'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
      });
    });

    it('should generate a valid reset token', async () => {
      // Ensure user has no existing token
      const userWithoutToken = { ...mockUser, resetPasswordToken: null, resetPasswordExpiry: null };
      userRepository.findOneByField.mockResolvedValue(userWithoutToken as User);
      userRepository.save.mockImplementation(async (user) => user as User);

      await useCase.execute(email);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      );
    });

    it('should set expiry time to 1 hour from now', async () => {
      const before = new Date();
      // Ensure user has no existing token
      const userWithoutToken = { ...mockUser, resetPasswordToken: null, resetPasswordExpiry: null };
      userRepository.findOneByField.mockResolvedValue(userWithoutToken as User);
      userRepository.save.mockImplementation(async (user) => user as User);

      await useCase.execute(email);
      const after = new Date();

      const savedUser = userRepository.save.mock.calls[0][0];
      const expiryTime = savedUser.resetPasswordExpiry!;

      const oneHourFromBefore = new Date(before.getTime() + 60 * 60 * 1000);
      const oneHourFromAfter = new Date(after.getTime() + 60 * 60 * 1000);

      expect(expiryTime.getTime()).toBeGreaterThanOrEqual(
        oneHourFromBefore.getTime(),
      );
      expect(expiryTime.getTime()).toBeLessThanOrEqual(
        oneHourFromAfter.getTime(),
      );
    });

    it('should use FRONTEND_URL environment variable for reset link', async () => {
      const originalEnv = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'https://test.example.com';

      // Ensure user has no existing token
      const userWithoutToken = { ...mockUser, resetPasswordToken: null, resetPasswordExpiry: null };
      userRepository.findOneByField.mockResolvedValue(userWithoutToken as User);
      userRepository.save.mockResolvedValue(userWithoutToken as User);

      await useCase.execute(email);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.PASSWORD_RESET,
        expect.objectContaining({
          email: email,
          firstName: mockUser.firstName,
          resetLink: expect.stringContaining(
            'https://test.example.com/reset-password?token=',
          ),
        }),
      );

      process.env.FRONTEND_URL = originalEnv;
    });

    it('should not generate new token if existing token is still valid', async () => {
      const validExpiry = new Date();
      validExpiry.setMinutes(validExpiry.getMinutes() + 30); // 30 minutes in future
      
      const userWithValidToken = {
        ...mockUser,
        resetPasswordToken: 'existing-valid-token',
        resetPasswordExpiry: validExpiry,
      } as User;
      
      userRepository.findOneByField.mockResolvedValue(userWithValidToken);
      userRepository.save.mockResolvedValue(userWithValidToken);

      const result = await useCase.execute(email);

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_ATTEMPT',
          metadata: expect.objectContaining({
            attemptType: 'existing_token_reused',
          }),
        }),
      );
      expect(result).toEqual({
        message:
          'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
      });
    });

    it('should generate new token if existing token is expired', async () => {
      const expiredTime = new Date();
      expiredTime.setHours(expiredTime.getHours() - 2); // 2 hours ago
      
      const userWithExpiredToken = {
        ...mockUser,
        resetPasswordToken: 'expired-token',
        resetPasswordExpiry: expiredTime,
      } as User;
      
      userRepository.findOneByField.mockResolvedValue(userWithExpiredToken);
      userRepository.save.mockResolvedValue(userWithExpiredToken);

      await useCase.execute(email);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: expect.stringMatching(/^[a-f0-9]{64}$/),
          resetPasswordExpiry: expect.any(Date),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should log password reset attempts', async () => {
      // Ensure user has no existing token
      const userWithoutToken = { ...mockUser, resetPasswordToken: null, resetPasswordExpiry: null };
      userRepository.findOneByField.mockResolvedValue(userWithoutToken as User);
      userRepository.save.mockResolvedValue(userWithoutToken as User);

      await useCase.execute(email);

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledTimes(2);
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_REQUESTED',
        }),
      );
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_ATTEMPT',
          metadata: expect.objectContaining({
            attemptType: 'new_token_generated',
          }),
        }),
      );
    });
  });
});
