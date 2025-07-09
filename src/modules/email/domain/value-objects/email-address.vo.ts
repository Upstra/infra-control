import { InvalidEmailAddressException } from '../exceptions/email.exception';

export class EmailAddressVO {
  private readonly email: string;

  constructor(email: string) {
    if (!EmailAddressVO.isValid(email)) {
      throw new InvalidEmailAddressException(email);
    }
    this.email = email;
  }

  public get value(): string {
    return this.email;
  }

  public toString(): string {
    return this.email;
  }

  public equals(other: EmailAddressVO): boolean {
    return this.email === other.email;
  }

  public static isValid(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    const re =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return re.test(email);
  }
}
