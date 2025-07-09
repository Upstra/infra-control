import { Test, TestingModule } from '@nestjs/testing';
import { SendResetPasswordEmailUseCase } from '../send-reset-password-email.use-case';
import { IMailService } from '../../../domain/services/mail.service';
import { MAIL_SERVICE_TOKEN } from '../../../domain/constants/injection-tokens';
import { InvalidEmailAddressException } from '../../../domain/exceptions/email.exception';
import { SendEmailDto } from '../../dto/send-email.dto';

describe('SendResetPasswordEmailUseCase', () => {
  let useCase: SendResetPasswordEmailUseCase;
  let mockMailService: jest.Mocked<IMailService>;

  beforeEach(async () => {
    mockMailService = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendResetPasswordEmailUseCase,
        {
          provide: MAIL_SERVICE_TOKEN,
          useValue: mockMailService,
        },
      ],
    }).compile();

    useCase = module.get<SendResetPasswordEmailUseCase>(
      SendResetPasswordEmailUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should send reset password email with correct parameters', async () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';
      const firstname = 'John';

      await useCase.execute(email, resetLink, firstname);

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

      expect(callArgs.to.value).toBe(email);
      expect(callArgs.subject).toBe('Réinitialisation de votre mot de passe');
      expect(callArgs.template).toBe('reset-password');
      expect(callArgs.context).toMatchObject({
        prenom: firstname,
        email,
        resetLink,
      });
      expect(callArgs.context.requestDate).toBeDefined();
      expect(callArgs.context.requestTime).toBeDefined();
    });

    it('should handle invalid email gracefully', async () => {
      const invalidEmail = 'invalid-email';
      const resetLink = 'https://example.com/reset?token=abc123';
      const firstname = 'John';

      await expect(
        useCase.execute(invalidEmail, resetLink, firstname),
      ).rejects.toThrow(InvalidEmailAddressException);
      expect(mockMailService.send).not.toHaveBeenCalled();
    });

    it('should propagate mail service errors', async () => {
      const email = 'test@example.com';
      const resetLink = 'https://example.com/reset?token=abc123';
      const firstname = 'John';
      const error = new Error('Mail service error');

      mockMailService.send.mockRejectedValueOnce(error);

      await expect(
        useCase.execute(email, resetLink, firstname),
      ).rejects.toThrow(error);
      expect(mockMailService.send).toHaveBeenCalledTimes(1);
    });

    it('should handle empty resetLink', async () => {
      const email = 'test@example.com';
      const resetLink = '';
      const firstname = 'John';

      await useCase.execute(email, resetLink, firstname);

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

      expect(callArgs.context).toMatchObject({
        prenom: firstname,
        email,
        resetLink: '',
      });
      expect(callArgs.context.requestDate).toBeDefined();
      expect(callArgs.context.requestTime).toBeDefined();
    });

    it('should handle all parameters correctly', async () => {
      const email = 'user@domain.com';
      const resetLink = 'https://app.com/reset/token123';
      const firstname = 'Jane';

      await useCase.execute(email, resetLink, firstname);

      const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;
      expect(callArgs.to.value).toBe(email);
      expect(callArgs.context).toMatchObject({
        prenom: firstname,
        email,
        resetLink,
      });
      expect(callArgs.context.requestDate).toBeDefined();
      expect(callArgs.context.requestTime).toBeDefined();
    });
  });
});
