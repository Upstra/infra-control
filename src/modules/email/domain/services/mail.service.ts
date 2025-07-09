import { SendEmailDto } from '../../application/dto/send-email.dto';

export interface IMailService {
  /**
   * Send a templated transactional email.
   * @param dto  Contains recipient address, subject, template name and context.
   */
  send(dto: SendEmailDto): Promise<void>;
}
