import {
  CanActivate,
  ForbiddenException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class TwoFAGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.isTwoFactorEnabled) {
      throw new ForbiddenException('Le 2FA est déjà activé.');
    }

    return true;
  }
}
