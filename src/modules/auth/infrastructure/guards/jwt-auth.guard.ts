import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  handleRequest(
    err: unknown,
    user: any,
    info: unknown,
    context: ExecutionContext,
  ) {
    if (user) {
      const { userId, email, isTwoFactorEnabled, role } = user;
      const newToken = this.jwtService.sign(
        { userId, email, isTwoFactorEnabled, role },
        { expiresIn: undefined },
      );
      context
        .switchToHttp()
        .getResponse()
        .setHeader('x-access-token', newToken);
    }

    // Delegate to the default implementation for error handling
    return super.handleRequest(err, user, info, context);
  }
}
