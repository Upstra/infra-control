import { Test, TestingModule } from '@nestjs/testing';
import { SendAccountCreatedEmailUseCase } from '../send-account-created-email.use-case';
import { IMailService } from '../../../domain/services/mail.service';
import { MAIL_SERVICE_TOKEN } from '../../../domain/constants/injection-tokens';
import { InvalidEmailAddressException } from '../../../domain/exceptions/email.exception';
import { SendEmailDto } from '../../dto/send-email.dto';

describe('SendAccountCreatedEmailUseCase', () => {
  let useCase: SendAccountCreatedEmailUseCase;
  let mockMailService: jest.Mocked<IMailService>;

  beforeEach(async () => {
    mockMailService = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendAccountCreatedEmailUseCase,
        {
          provide: MAIL_SERVICE_TOKEN,
          useValue: mockMailService,
        },
      ],
    }).compile();

    useCase = module.get<SendAccountCreatedEmailUseCase>(
      SendAccountCreatedEmailUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should send account created email with correct parameters', async () => {
      const email = 'test@example.com';
      const firstName = 'John';

      await useCase.execute(email, firstName);

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

      expect(callArgs.to.value).toBe(email);
      expect(callArgs.subject).toBe('Bienvenue sur Upstra !');
      expect(callArgs.template).toBe('account-created');
      expect(callArgs.context).toEqual({ prenom: firstName, email });
    });

    it('should handle invalid email gracefully', async () => {
      const invalidEmail = 'invalid-email';
      const firstName = 'John';

      await expect(useCase.execute(invalidEmail, firstName)).rejects.toThrow(
        InvalidEmailAddressException,
      );
      expect(mockMailService.send).not.toHaveBeenCalled();
    });

    it('should propagate mail service errors', async () => {
      const email = 'test@example.com';
      const firstName = 'John';
      const error = new Error('Mail service error');

      mockMailService.send.mockRejectedValueOnce(error);

      await expect(useCase.execute(email, firstName)).rejects.toThrow(error);
      expect(mockMailService.send).toHaveBeenCalledTimes(1);
    });

    it('should handle empty firstName', async () => {
      const email = 'test@example.com';
      const firstName = '';

      await useCase.execute(email, firstName);

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

      expect(callArgs.context).toEqual({ prenom: '', email });
    });
  });
});
