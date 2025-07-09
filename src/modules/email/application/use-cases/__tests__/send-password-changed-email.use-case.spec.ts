import { Test, TestingModule } from '@nestjs/testing';
import { SendPasswordChangedEmailUseCase } from '../send-password-changed-email.use-case';
import { IMailService } from '../../../domain/services/mail.service';
import { MAIL_SERVICE_TOKEN } from '../../../domain/constants/injection-tokens';
import { InvalidEmailAddressException } from '../../../domain/exceptions/email.exception';
import { SendEmailDto } from '../../dto/send-email.dto';

describe('SendPasswordChangedEmailUseCase', () => {
  let useCase: SendPasswordChangedEmailUseCase;
  let mockMailService: jest.Mocked<IMailService>;

  beforeEach(async () => {
    mockMailService = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendPasswordChangedEmailUseCase,
        {
          provide: MAIL_SERVICE_TOKEN,
          useValue: mockMailService,
        },
      ],
    }).compile();

    useCase = module.get<SendPasswordChangedEmailUseCase>(
      SendPasswordChangedEmailUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should send password changed email with correct parameters', async () => {
      const email = 'test@example.com';
      const firstname = 'John';

      await useCase.execute(email, firstname);

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

      expect(callArgs.to.value).toBe(email);
      expect(callArgs.subject).toBe('Votre mot de passe a été changé');
      expect(callArgs.template).toBe('password-changed');
      expect(callArgs.context).toMatchObject({ 
        prenom: firstname,
        email,
        ipAddress: '127.0.0.1',
        userAgent: 'Navigateur web',
        location: 'France'
      });
      expect(callArgs.context.changeDate).toBeDefined();
      expect(callArgs.context.changeTime).toBeDefined();
    });

    it('should handle invalid email gracefully', async () => {
      const invalidEmail = 'invalid-email';
      const firstname = 'John';

      await expect(useCase.execute(invalidEmail, firstname)).rejects.toThrow(InvalidEmailAddressException);
      expect(mockMailService.send).not.toHaveBeenCalled();
    });

    it('should propagate mail service errors', async () => {
      const email = 'test@example.com';
      const firstname = 'John';
      const error = new Error('Mail service error');

      mockMailService.send.mockRejectedValueOnce(error);

      await expect(useCase.execute(email, firstname)).rejects.toThrow(error);
      expect(mockMailService.send).toHaveBeenCalledTimes(1);
    });

    it('should handle empty firstname', async () => {
      const email = 'test@example.com';
      const firstname = '';

      await useCase.execute(email, firstname);

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

      expect(callArgs.context).toMatchObject({ 
        prenom: '',
        email,
        ipAddress: '127.0.0.1',
        userAgent: 'Navigateur web',
        location: 'France'
      });
      expect(callArgs.context.changeDate).toBeDefined();
      expect(callArgs.context.changeTime).toBeDefined();
    });

    it('should send notification for different users', async () => {
      const testCases = [
        { email: 'user1@example.com', firstname: 'Alice' },
        { email: 'user2@example.com', firstname: 'Bob' },
        { email: 'admin@company.com', firstname: 'Admin' },
      ];

      for (const testCase of testCases) {
        mockMailService.send.mockClear();
        await useCase.execute(testCase.email, testCase.firstname);

        expect(mockMailService.send).toHaveBeenCalledTimes(1);
        const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

        expect(callArgs.to.value).toBe(testCase.email);
        expect(callArgs.context).toMatchObject({
          prenom: testCase.firstname,
          email: testCase.email,
          ipAddress: '127.0.0.1',
          userAgent: 'Navigateur web',
          location: 'France'
        });
        expect(callArgs.context.changeDate).toBeDefined();
        expect(callArgs.context.changeTime).toBeDefined();
      }
    });
  });
});