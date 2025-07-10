export interface IEmailService {
  sendTestEmail(to: string, config: any): Promise<void>;
}