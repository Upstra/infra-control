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
      const firstName = 'John';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      const location = 'France';

      await useCase.execute(email, firstName, ipAddress, userAgent, location);

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

      expect(callArgs.to.value).toBe(email);
      expect(callArgs.subject).toBe('Votre mot de passe a été changé');
      expect(callArgs.template).toBe('password-changed');
      expect(callArgs.context).toMatchObject({
        prenom: firstName,
        email,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        location: 'France',
      });
      expect(callArgs.context.changeDate).toBeDefined();
      expect(callArgs.context.changeTime).toBeDefined();
    });

    it('should use default values when optional parameters are not provided', async () => {
      const email = 'test@example.com';
      const firstName = 'John';

      await useCase.execute(email, firstName);

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

      expect(callArgs.context).toMatchObject({
        prenom: firstName,
        email,
        ipAddress: 'Adresse IP non disponible',
        userAgent: 'Agent utilisateur non disponible',
        location: 'Localisation non disponible',
      });
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

      expect(callArgs.context).toMatchObject({
        prenom: '',
        email,
        ipAddress: 'Adresse IP non disponible',
        userAgent: 'Agent utilisateur non disponible',
        location: 'Localisation non disponible',
      });
      expect(callArgs.context.changeDate).toBeDefined();
      expect(callArgs.context.changeTime).toBeDefined();
    });

    it('should send notification for different users', async () => {
      const testCases = [
        { email: 'user1@example.com', firstName: 'Alice' },
        { email: 'user2@example.com', firstName: 'Bob' },
        { email: 'admin@company.com', firstName: 'Admin' },
      ];

      for (const testCase of testCases) {
        mockMailService.send.mockClear();
        await useCase.execute(testCase.email, testCase.firstName);

        expect(mockMailService.send).toHaveBeenCalledTimes(1);
        const callArgs = mockMailService.send.mock.calls[0][0] as SendEmailDto;

        expect(callArgs.to.value).toBe(testCase.email);
        expect(callArgs.context).toMatchObject({
          prenom: testCase.firstName,
          email: testCase.email,
          ipAddress: 'Adresse IP non disponible',
          userAgent: 'Agent utilisateur non disponible',
          location: 'Localisation non disponible',
        });
        expect(callArgs.context.changeDate).toBeDefined();
        expect(callArgs.context.changeTime).toBeDefined();
      }
    });
  });
});
