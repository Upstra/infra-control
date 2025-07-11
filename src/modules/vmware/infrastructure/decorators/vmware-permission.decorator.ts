import { SetMetadata } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { VMWARE_PERMISSION_KEY } from '../guards/vmware-permission.guard';

export const VmwarePermission = (requiredBit: PermissionBit) =>
  SetMetadata(VMWARE_PERMISSION_KEY, { requiredBit });