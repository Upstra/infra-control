import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { ZohoMailAdapter } from '../zoho-mail.adapter';
import { SendEmailDto } from '../../application/dto/send-email.dto';
import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';
import { EmailSendFailedException } from '../../domain/exceptions/email.exception';

describe('ZohoMailAdapter', () => {
  let adapter: ZohoMailAdapter;
  let mockMailerService: jest.Mocked<MailerService>;

  beforeEach(async () => {
    mockMailerService = {
      sendMail: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZohoMailAdapter,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    adapter = module.get<ZohoMailAdapter>(ZohoMailAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('send', () => {
    it('should send email with correct parameters', async () => {
      const dto = new SendEmailDto();
      dto.to = new EmailAddressVO('test@example.com');
      dto.subject = 'Test Subject';
      dto.template = 'account-created';
      dto.context = { name: 'John' };

      mockMailerService.sendMail.mockResolvedValueOnce({} as any);

      await adapter.send(dto);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'account-created',
        context: {
          name: 'John',
          logoUrl:
            'https://github.com/Upstra/.github/blob/dcd1f2dc99276f0fd22eea7b8dd7f35902c562cc/PA2025%20Upstra%20Logo.png?raw=true',
          loginUrl: 'http://localhost:3000',
          currentYear: new Date().getFullYear(),
        },
      });
    });

    it('should handle multiple recipients', async () => {
      const dto = new SendEmailDto();
      dto.to = new EmailAddressVO('user1@example.com');
      dto.subject = 'Multi-recipient Test';
      dto.template = 'password-changed';
      dto.context = { message: 'Hello everyone' };

      mockMailerService.sendMail.mockResolvedValueOnce({} as any);

      await adapter.send(dto);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'user1@example.com',
        subject: 'Multi-recipient Test',
        template: 'password-changed',
        context: {
          message: 'Hello everyone',
          logoUrl:
            'https://github.com/Upstra/.github/blob/dcd1f2dc99276f0fd22eea7b8dd7f35902c562cc/PA2025%20Upstra%20Logo.png?raw=true',
          loginUrl: 'http://localhost:3000',
          currentYear: new Date().getFullYear(),
        },
      });
    });

    it('should throw error when mailer service fails', async () => {
      const dto = new SendEmailDto();
      dto.to = new EmailAddressVO('test@example.com');
      dto.subject = 'Test Subject';
      dto.template = 'account-created';
      dto.context = {};

      const error = new Error('SMTP connection failed');
      mockMailerService.sendMail.mockRejectedValueOnce(error);

      await expect(adapter.send(dto)).rejects.toThrow(EmailSendFailedException);
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should log successful email send', async () => {
      const logSpy = jest.spyOn(adapter['logger'], 'log');
      const dto = new SendEmailDto();
      dto.to = new EmailAddressVO('test@example.com');
      dto.subject = 'Test Subject';
      dto.template = 'account-created';
      dto.context = {};

      mockMailerService.sendMail.mockResolvedValueOnce({} as any);

      await adapter.send(dto);

      expect(logSpy).toHaveBeenCalledWith(
        'Email sent to test@example.com using template account-created',
      );
    });

    it('should log error when email send fails', async () => {
      const errorSpy = jest.spyOn(adapter['logger'], 'error');
      const dto = new SendEmailDto();
      dto.to = new EmailAddressVO('test@example.com');
      dto.subject = 'Test Subject';
      dto.template = 'account-created';
      dto.context = {};

      const error = new Error('SMTP error');
      mockMailerService.sendMail.mockRejectedValueOnce(error);

      await expect(adapter.send(dto)).rejects.toThrow(EmailSendFailedException);

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send email to test@example.com',
        expect.any(String),
      );
    });

    it('should handle empty context', async () => {
      const dto = new SendEmailDto();
      dto.to = new EmailAddressVO('test@example.com');
      dto.subject = 'No Context Email';
      dto.template = 'reset-password';
      dto.context = {};

      mockMailerService.sendMail.mockResolvedValueOnce({} as any);

      await adapter.send(dto);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'No Context Email',
        template: 'reset-password',
        context: {
          logoUrl:
            'https://github.com/Upstra/.github/blob/dcd1f2dc99276f0fd22eea7b8dd7f35902c562cc/PA2025%20Upstra%20Logo.png?raw=true',
          loginUrl: 'http://localhost:3000',
          currentYear: new Date().getFullYear(),
        },
      });
    });

    it('should handle complex context objects', async () => {
      const dto = new SendEmailDto();
      dto.to = new EmailAddressVO('test@example.com');
      dto.subject = 'Complex Context';
      dto.template = 'account-created';
      dto.context = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        items: ['item1', 'item2'],
        metadata: {
          timestamp: '2025-01-01',
          version: '1.0',
        },
      };

      mockMailerService.sendMail.mockResolvedValueOnce({} as any);

      await adapter.send(dto);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Complex Context',
        template: 'account-created',
        context: {
          ...dto.context,
          logoUrl:
            'https://github.com/Upstra/.github/blob/dcd1f2dc99276f0fd22eea7b8dd7f35902c562cc/PA2025%20Upstra%20Logo.png?raw=true',
          loginUrl: 'http://localhost:3000',
          currentYear: new Date().getFullYear(),
        },
      });
    });
  });
});
