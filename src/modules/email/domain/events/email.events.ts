export enum EmailEventType {
  ACCOUNT_CREATED = 'email.account.created',
  PASSWORD_CHANGED = 'email.password.changed',
  PASSWORD_RESET = 'email.password.reset',
}

export interface AccountCreatedEvent {
  email: string;
  firstname: string;
}

export interface PasswordChangedEvent {
  email: string;
  firstname: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface PasswordResetEvent {
  email: string;
  firstname: string;
  resetLink: string;
}
