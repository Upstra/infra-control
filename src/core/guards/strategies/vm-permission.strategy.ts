import { Injectable } from '@nestjs/common';
import { PermissionCheckStrategy } from './permission-strategy.interface';
import { GetUserVmPermissionsUseCase } from '@/modules/permissions/application/use-cases/permission-vm/get-user-permission-vm-use-case';
import { PermissionUtils } from '@/core/utils/index';

@Injectable()
export class VmPermissionStrategy implements PermissionCheckStrategy {
  constructor(
    private readonly getUserVmPermissionsUseCase: GetUserVmPermissionsUseCase,
  ) {}

  async checkPermission(
    userId: string,
    resourceId: string,
    requiredBit: number,
  ): Promise<boolean> {
    const permissionVms =
      await this.getUserVmPermissionsUseCase.execute(userId);

    if (!permissionVms || !permissionVms) {
      return false;
    }

    const permission = permissionVms.find((perm) => perm.vmId === resourceId);

    if (!permission) {
      return false;
    }

    return PermissionUtils.has(permission.bitmask, requiredBit);
  }
}
