import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';

export class SendEmailDto {
  to: EmailAddressVO;
  subject: string;
  template:
    | 'reset-password'
    | 'password-changed'
    | 'account-created'
    | 'vmware-sync-report'
    | 'ups-battery-alert';
  context: Record<string, any>;
}
