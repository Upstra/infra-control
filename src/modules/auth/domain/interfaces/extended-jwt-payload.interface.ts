import { JwtPayload } from '@/core/types/jwt-payload.interface';

export interface ExtendedJwtPayload extends JwtPayload {
  roles?: any[];
}
