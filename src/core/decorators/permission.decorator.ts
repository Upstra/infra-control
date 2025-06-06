import { SetMetadata } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

export const PERMISSION_KEY = 'permission_check';

export type PermissionTarget = 'vm' | 'server';

export const Permission = (
  type: PermissionTarget,
  requiredBit: PermissionBit,
) => SetMetadata(PERMISSION_KEY, { type, requiredBit });
