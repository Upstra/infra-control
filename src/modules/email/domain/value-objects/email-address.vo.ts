export class EmailAddressVO {
  private readonly email: string;

  constructor(email: string) {
    if (!EmailAddressVO.isValid(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }
    this.email = email;
  }

  public get value(): string {
    return this.email;
  }

  public static isValid(email: string): boolean {
    const re =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return typeof email === 'string' && re.test(email);
  }
}
