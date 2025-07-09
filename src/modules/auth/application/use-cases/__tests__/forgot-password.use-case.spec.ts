import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForgotPasswordUseCase } from '../forgot-password.use-case';
import { UserRepositoryInterface } from '../../../../users/domain/interfaces/user.repository.interface';
import { User } from '../../../../users/domain/entities/user.entity';
import { EmailEventType } from '../../../../email/domain/events/email.events';

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let historyService: any;

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
          provide: 'HistoryService',
          useValue: {
            logEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ForgotPasswordUseCase>(ForgotPasswordUseCase);
    userRepository = module.get('UserRepositoryInterface');
    eventEmitter = module.get(EventEmitter2);
    historyService = module.get('HistoryService');
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
          to: email,
          subject: 'Réinitialisation de votre mot de passe',
          context: expect.objectContaining({
            firstName: mockUser.firstName,
            resetLink: expect.stringContaining('reset-password?token='),
            expirationTime: '1 heure',
          }),
        }),
      );
      expect(historyService.logEvent).toHaveBeenCalledWith({
        eventType: 'AUTH',
        userId: mockUser.id,
        eventData: {
          action: 'PASSWORD_RESET_REQUESTED',
          email: mockUser.email,
          timestamp: expect.any(String),
        },
      });
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
      });
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(historyService.logEvent).not.toHaveBeenCalled();
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
      userRepository.findOneByField.mockResolvedValue(mockUser as User);
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
      userRepository.findOneByField.mockResolvedValue(mockUser as User);
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

      userRepository.findOneByField.mockResolvedValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);

      await useCase.execute(email);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.PASSWORD_RESET,
        expect.objectContaining({
          context: expect.objectContaining({
            resetLink: expect.stringContaining(
              'https://test.example.com/reset-password?token=',
            ),
          }),
        }),
      );

      process.env.FRONTEND_URL = originalEnv;
    });
  });
});