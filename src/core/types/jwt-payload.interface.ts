import { RoleDto } from '@/modules/roles/application/dto/role.dto';

export interface JwtPayload {
  userId: string;
  email: string;
  isTwoFactorEnabled: boolean;
  role: RoleDto;
  isActive: boolean;
}
