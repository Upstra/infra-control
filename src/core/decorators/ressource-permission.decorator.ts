import { SetMetadata } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

export const RESOURCE_PERMISSION_KEY = 'resourcePermission';

export interface ResourcePermissionMetadata {
  resourceType: 'server' | 'vm';
  requiredBit: PermissionBit;
  resourceIdSource: 'body' | 'params' | 'query';
  resourceIdField: string;
}

export const RequireResourcePermission = (
  metadata: ResourcePermissionMetadata,
) => SetMetadata(RESOURCE_PERMISSION_KEY, metadata);
