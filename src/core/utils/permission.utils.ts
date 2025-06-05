import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

export const PermissionUtils = {
  has: (mask: number, perm: PermissionBit): boolean => (mask & perm) === perm,

  grant: (mask: number, perm: PermissionBit): number => mask | perm,

  revoke: (mask: number, perm: PermissionBit): number => mask & ~perm,
};
