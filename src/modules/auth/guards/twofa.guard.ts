import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TwoFAGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Logique 2FA ici si tu veux forcer
    return true;
  }
}
