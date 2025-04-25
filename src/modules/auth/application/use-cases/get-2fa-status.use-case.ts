// 📁 src/modules/auth/application/use-cases/get-2fa-status.use-case.ts
import { Injectable } from '@nestjs/common';
import { GetUserByEmailUseCase } from '@/modules/users/application/use-cases';

@Injectable()
export class Get2FAStatusUseCase {
  constructor(private readonly findUserByEmail: GetUserByEmailUseCase) {}

  async execute(email: string): Promise<{ isTwoFactorEnabled: boolean }> {
    const user = await this.findUserByEmail.execute(email);
    return { isTwoFactorEnabled: !!user?.isTwoFactorEnabled };
  }
}
