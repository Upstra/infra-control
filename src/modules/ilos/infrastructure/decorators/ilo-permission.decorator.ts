import { SetMetadata } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ILO_PERMISSION_KEY } from '../guards/ilo-permission.guard';

export const IloPermission = (requiredBit: PermissionBit) =>
  SetMetadata(ILO_PERMISSION_KEY, { requiredBit });
