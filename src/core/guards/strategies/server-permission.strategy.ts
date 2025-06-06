import { Injectable } from '@nestjs/common';
import { PermissionCheckStrategy } from './permission-strategy.interface';
import { GetUserServerPermissionsUseCase } from '@/modules/permissions/application/use-cases/permission-server/get-user-permission-server-use-case';
import { PermissionUtils } from '@/core/utils/index';

@Injectable()
export class ServerPermissionStrategy implements PermissionCheckStrategy {
  constructor(
    private readonly getUserServerPermissionsUseCase: GetUserServerPermissionsUseCase,
  ) {}

  async checkPermission(
    userId: string,
    resourceId: string,
    requiredBit: number,
  ): Promise<boolean> {
    const permissionServers =
      await this.getUserServerPermissionsUseCase.execute(userId);

    if (!permissionServers || !permissionServers) {
      return false;
    }

    const permission = permissionServers.find(
      (perm) => perm.serverId === resourceId,
    );

    if (!permission) {
      return false;
    }

    return PermissionUtils.has(permission.bitmask, requiredBit);
  }
}
