import { SendEmailDto } from '../send-email.dto';
import { EmailAddressVO } from '../../../domain/value-objects/email-address.vo';

describe('SendEmailDto', () => {
  it('should create a valid DTO instance', () => {
    const dto = new SendEmailDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(SendEmailDto);
  });

  it('should accept all required properties', () => {
    const dto = new SendEmailDto();
    const email = new EmailAddressVO('test@example.com');

    dto.to = email;
    dto.subject = 'Test Subject';
    dto.template = 'account-created';
    dto.context = { name: 'John' };

    expect(dto.to).toBe(email);
    expect(dto.subject).toBe('Test Subject');
    expect(dto.template).toBe('account-created');
    expect(dto.context).toEqual({ name: 'John' });
  });

  it('should accept different template types', () => {
    const dto = new SendEmailDto();
    const templates: Array<
      'reset-password' | 'password-changed' | 'account-created'
    > = ['reset-password', 'password-changed', 'account-created'];

    templates.forEach((template) => {
      dto.template = template;
      expect(dto.template).toBe(template);
    });
  });

  it('should accept complex context objects', () => {
    const dto = new SendEmailDto();
    const complexContext = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        id: 123,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      items: ['item1', 'item2', 'item3'],
    };

    dto.context = complexContext;
    expect(dto.context).toEqual(complexContext);
  });

  it('should handle empty context', () => {
    const dto = new SendEmailDto();
    dto.context = {};
    expect(dto.context).toEqual({});
  });

  it('should handle undefined properties initially', () => {
    const dto = new SendEmailDto();
    expect(dto.to).toBeUndefined();
    expect(dto.subject).toBeUndefined();
    expect(dto.template).toBeUndefined();
    expect(dto.context).toBeUndefined();
  });
});
