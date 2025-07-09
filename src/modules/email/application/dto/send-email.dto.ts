import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';

export class SendEmailDto {
  to: EmailAddressVO;
  subject: string;
  template: 'reset-password' | 'password-changed' | 'account-created';
  context: Record<string, any>;
}
