import { JwtPayload } from '@/core/types/jwt-payload.interface';

export interface ExtendedJwtPayload extends JwtPayload {
  isTwoFactorEnabled?: boolean;
  role?: any;
  roles?: any[];
  isActive?: boolean;
}