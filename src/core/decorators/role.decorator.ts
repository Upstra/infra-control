import { SetMetadata } from '@nestjs/common';

export const ROLE_KEY = 'role';

export interface RoleRequirement {
  canCreateServer?: boolean;
  canCreateVm?: boolean;
}

export const RequireRole = (requirement: RoleRequirement) =>
  SetMetadata(ROLE_KEY, requirement);
