import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

@Injectable()
export class RenewTokenUseCase {
  constructor(private readonly jwtService: JwtService) {}

  execute(user: JwtPayload & { isTwoFactorEnabled?: boolean; role?: any }) {
    const token = this.jwtService.sign(
      {
        userId: user.userId,
        email: user.email,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        role: user.role,
      },
      { expiresIn: undefined },
    );

    return { accessToken: token };
  }
}
