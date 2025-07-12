import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnauthorizedException } from '@nestjs/common';
import { ResetPasswordWithTokenUseCase } from '../reset-password-with-token.use-case';
import { UserRepositoryInterface } from '../../../../users/domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../../../users/domain/services/user.domain.service';
import { LogHistoryUseCase } from '../../../../history/application/use-cases/log-history.use-case';
import { User } from '../../../../users/domain/entities/user.entity';
import { EmailEventType } from '../../../../email/domain/events/email.events';
import { createMockUser } from '../../../__mocks__/user.mock';

describe('ResetPasswordWithTokenUseCase', () => {
  let useCase: ResetPasswordWithTokenUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let userDomainService: jest.Mocked<UserDomainService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;

  const mockUser = createMockUser({
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'oldHashedPassword',
    resetPasswordToken: 'validtoken123',
    resetPasswordExpiry: new Date(Date.now() + 3600000), // 1 hour from now
    isActive: true,
    isVerified: true,
    isTwoFactorEnabled: false,
    twoFactorSecret: '',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordWithTokenUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findOneByField: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: UserDomainService,
          useValue: {
            hashPassword: jest.fn(),
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

    useCase = module.get<ResetPasswordWithTokenUseCase>(
      ResetPasswordWithTokenUseCase,
    );
    userRepository = module.get('UserRepositoryInterface');
    userDomainService = module.get(UserDomainService);
    eventEmitter = module.get(EventEmitter2);
    logHistoryUseCase = module.get(LogHistoryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const token = 'validtoken123';
    const newPassword = 'NewSecurePassword123!';
    const hashedPassword = 'newHashedPassword';

    it('should reset password successfully with valid token', async () => {
      userRepository.findOneByField.mockResolvedValue(mockUser);
      userDomainService.hashPassword.mockResolvedValue(hashedPassword);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      } as User);

      const result = await useCase.execute(token, newPassword);

      expect(userRepository.findOneByField).toHaveBeenCalledWith({
        field: 'resetPasswordToken',
        value: token,
      });
      expect(userDomainService.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpiry: null,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.PASSWORD_CHANGED,
        {
          email: mockUser.email,
          firstname: mockUser.firstName,
        },
      );
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'user',
        entityId: mockUser.id,
        action: 'PASSWORD_RESET_WITH_TOKEN',
        userId: mockUser.id,
        oldValue: { passwordHash: 'oldHashedPassword' },
        newValue: { passwordHash: hashedPassword },
        metadata: {
          performedBy: 'self',
          method: 'token',
        },
      });
      expect(result).toEqual({
        message: 'Votre mot de passe a été réinitialisé avec succès',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOneByField.mockResolvedValue(null);

      await expect(useCase.execute(token, newPassword)).rejects.toThrow(
        new UnauthorizedException('Token de réinitialisation invalide'),
      );

      expect(userDomainService.hashPassword).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      const userWithoutToken = createMockUser({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'oldHashedPassword',
        resetPasswordToken: null,
        resetPasswordExpiry: new Date(Date.now() + 3600000),
        isActive: true,
        isVerified: true,
        isTwoFactorEnabled: false,
        twoFactorSecret: '',
      });
      userRepository.findOneByField.mockResolvedValue(userWithoutToken);

      await expect(useCase.execute(token, newPassword)).rejects.toThrow(
        new UnauthorizedException('Token de réinitialisation invalide'),
      );
      
      expect(userDomainService.hashPassword).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when expiry is missing', async () => {
      const userWithoutExpiry = createMockUser({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'oldHashedPassword',
        resetPasswordToken: 'validtoken123',
        resetPasswordExpiry: null,
        isActive: true,
        isVerified: true,
        isTwoFactorEnabled: false,
        twoFactorSecret: '',
      });
      userRepository.findOneByField.mockResolvedValue(userWithoutExpiry);

      await expect(useCase.execute(token, newPassword)).rejects.toThrow(
        new UnauthorizedException('Token de réinitialisation invalide'),
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const expiredUser = createMockUser({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'oldHashedPassword',
        resetPasswordToken: 'validtoken123',
        resetPasswordExpiry: new Date(Date.now() - 3600000), // 1 hour ago
        isActive: true,
        isVerified: true,
        isTwoFactorEnabled: false,
        twoFactorSecret: '',
      });
      userRepository.findOneByField.mockResolvedValue(expiredUser);

      await expect(useCase.execute(token, newPassword)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(userDomainService.hashPassword).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should use username as fallback when firstName is not available', async () => {
      const userWithoutFirstName = createMockUser({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: '',
        lastName: 'User',
        password: 'oldHashedPassword',
        resetPasswordToken: 'validtoken123',
        resetPasswordExpiry: new Date(Date.now() + 3600000),
        isActive: true,
        isVerified: true,
        isTwoFactorEnabled: false,
        twoFactorSecret: '',
      });
      userRepository.findOneByField.mockResolvedValue(userWithoutFirstName);
      userDomainService.hashPassword.mockResolvedValue(hashedPassword);
      userRepository.save.mockResolvedValue(userWithoutFirstName);

      await useCase.execute(token, newPassword);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.PASSWORD_CHANGED,
        {
          email: mockUser.email,
          firstname: mockUser.username,
        },
      );
    });

    it('should clear reset token fields after successful reset', async () => {
      // Create a fresh user with token for this test
      const userWithToken = createMockUser({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'oldHashedPassword',
        resetPasswordToken: 'validtoken123',
        resetPasswordExpiry: new Date(Date.now() + 3600000),
        isActive: true,
        isVerified: true,
        isTwoFactorEnabled: false,
        twoFactorSecret: '',
      });
      
      userRepository.findOneByField.mockResolvedValue(userWithToken);
      userDomainService.hashPassword.mockResolvedValue(hashedPassword);

      let savedUser: User | null = null;
      userRepository.save.mockImplementation(async (user) => {
        savedUser = user as User;
        return user as User;
      });

      await useCase.execute(token, newPassword);

      expect(savedUser).toBeTruthy();
      expect(savedUser!.resetPasswordToken).toBeNull();
      expect(savedUser!.resetPasswordExpiry).toBeNull();
    });

    it('should handle database save errors gracefully', async () => {
      // Create a fresh user with token for this test
      const userWithToken = createMockUser({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'oldHashedPassword',
        resetPasswordToken: 'validtoken123',
        resetPasswordExpiry: new Date(Date.now() + 3600000),
        isActive: true,
        isVerified: true,
        isTwoFactorEnabled: false,
        twoFactorSecret: '',
      });
      
      userRepository.findOneByField.mockResolvedValue(userWithToken);
      userDomainService.hashPassword.mockResolvedValue(hashedPassword);
      userRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(token, newPassword)).rejects.toThrow(
        'Database error',
      );

      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
    });
  });
});
