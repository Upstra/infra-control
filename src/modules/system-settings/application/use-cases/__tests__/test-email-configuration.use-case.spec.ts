import { Test, TestingModule } from '@nestjs/testing';
import { TestEmailConfigurationUseCase } from '../test-email-configuration.use-case';
import { SystemSettingsService } from '../../../domain/services/system-settings.service';
import { EmailConfigurationException } from '../../../domain/exceptions/system-settings.exceptions';

const mockTransporter = {
  verify: jest.fn(),
  sendMail: jest.fn(),
};

jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => mockTransporter),
}));

describe('TestEmailConfigurationUseCase', () => {
  let useCase: TestEmailConfigurationUseCase;
  let systemSettingsService: SystemSettingsService;

  const mockSettings = {
    id: 'singleton',
    settings: {
      email: {
        enabled: true,
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: true,
          user: 'test@example.com',
          password: 'password123',
        },
        from: {
          name: 'Test System',
          address: 'noreply@example.com',
        },
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestEmailConfigurationUseCase,
        {
          provide: SystemSettingsService,
          useValue: {
            getSettings: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<TestEmailConfigurationUseCase>(
      TestEmailConfigurationUseCase,
    );
    systemSettingsService = module.get<SystemSettingsService>(
      SystemSettingsService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should send test email successfully', async () => {
      const testEmail = 'recipient@example.com';

      jest
        .spyOn(systemSettingsService, 'getSettings')
        .mockResolvedValue(mockSettings as any);
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await useCase.execute(testEmail);

      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransporter).toHaveBeenCalledWith({
        host: mockSettings.settings.email.smtp.host,
        port: mockSettings.settings.email.smtp.port,
        secure: mockSettings.settings.email.smtp.secure,
        auth: {
          user: mockSettings.settings.email.smtp.user,
          pass: mockSettings.settings.email.smtp.password,
        },
      });

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"${mockSettings.settings.email.from.name}" <${mockSettings.settings.email.from.address}>`,
        to: testEmail,
        subject: 'Test Email Configuration',
        text: 'This is a test email to verify the email configuration.',
        html: '<p>This is a test email to verify the email configuration.</p>',
      });
    });

    it('should throw error if email is disabled', async () => {
      const disabledSettings = {
        ...mockSettings,
        settings: {
          ...mockSettings.settings,
          email: {
            ...mockSettings.settings.email,
            enabled: false,
          },
        },
      };

      jest
        .spyOn(systemSettingsService, 'getSettings')
        .mockResolvedValue(disabledSettings as any);

      await expect(useCase.execute('test@example.com')).rejects.toThrow(
        new EmailConfigurationException(
          'Email is not enabled in system settings',
        ),
      );
    });

    it('should throw error if SMTP configuration is incomplete', async () => {
      const incompleteSettings = {
        ...mockSettings,
        settings: {
          ...mockSettings.settings,
          email: {
            ...mockSettings.settings.email,
            smtp: {
              ...mockSettings.settings.email.smtp,
              host: '',
            },
          },
        },
      };

      jest
        .spyOn(systemSettingsService, 'getSettings')
        .mockResolvedValue(incompleteSettings as any);

      await expect(useCase.execute('test@example.com')).rejects.toThrow(
        new EmailConfigurationException('SMTP configuration is incomplete'),
      );
    });

    it('should throw error if email verification fails', async () => {
      jest
        .spyOn(systemSettingsService, 'getSettings')
        .mockResolvedValue(mockSettings as any);
      mockTransporter.verify.mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      await expect(useCase.execute('test@example.com')).rejects.toThrow(
        new EmailConfigurationException(
          'Failed to send test email: SMTP connection failed',
        ),
      );
    });

    it('should throw error if email sending fails', async () => {
      jest
        .spyOn(systemSettingsService, 'getSettings')
        .mockResolvedValue(mockSettings as any);
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockRejectedValue(new Error('Failed to send'));

      await expect(useCase.execute('test@example.com')).rejects.toThrow(
        new EmailConfigurationException(
          'Failed to send test email: Failed to send',
        ),
      );
    });
  });
});
