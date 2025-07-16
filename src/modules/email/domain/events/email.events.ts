export enum EmailEventType {
  ACCOUNT_CREATED = 'email.account.created',
  PASSWORD_CHANGED = 'email.password.changed',
  PASSWORD_RESET = 'email.password.reset',
  VMWARE_SYNC_REPORT = 'email.vmware.sync.report',
}

export interface AccountCreatedEvent {
  email: string;
  firstName: string;
}

export interface PasswordChangedEvent {
  email: string;
  firstName: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface PasswordResetEvent {
  email: string;
  firstName: string;
  resetLink: string;
}

export interface VmwareSyncReportEvent {
  adminEmails: string[];
  date: string;
  duration: string;
  totalServers: number;
  successfulServers: number;
  failedServers: number;
  vmsUpdated: number;
  errors: string[];
}
