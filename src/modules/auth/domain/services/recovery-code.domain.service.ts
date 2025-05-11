import { Injectable } from '@nestjs/common';

@Injectable()
export class RecoveryCodeService {
  generate(): string[] {
    const codes: string[] = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';

    for (let i = 0; i < 10; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        const index = Math.floor(Math.random() * characters.length);
        code += characters[index];
      }
      codes.push(code.match(/.{1,4}/g)?.join('-') ?? code);
    }

    return codes;
  }

  async hash(codes: string[]): Promise<string[]> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    return Promise.all(codes.map((code) => bcrypt.hash(code, saltRounds)));
  }

  async compare(code: string, hashedCodes: string[]): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return Promise.any(
      hashedCodes.map((hashedCode) => bcrypt.compare(code, hashedCode)),
    );
  }
}
