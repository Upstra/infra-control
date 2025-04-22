import { Injectable } from '@nestjs/common';
import { UserService } from '../../../users/application/services/user.service';

@Injectable()
export class Get2FAStatusUseCase {
  constructor(private readonly userService: UserService) {}

  async execute(email: string) {
    const user = await this.userService.findRawByEmail(email);
    return { isTwoFactorEnabled: !!user?.isTwoFactorEnabled };
  }
}
