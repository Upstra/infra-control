import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  PermissionTarget,
} from '@/core/decorators/permission.decorator';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionUtils } from '@/core/utils/index';
import { ExpressRequestWithUser } from '../types/express-with-user.interface';
import { GetUserServerPermissionsUseCase } from '@/modules/permissions/application/use-cases/permission-server/get-user-permission-server-use-case';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly getUserServerPermissionsUseCase: GetUserServerPermissionsUseCase,
    //private getUserVmPermissionsUseCase: GetUserPermissionVmByIdsUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { type, requiredBit } =
      this.reflector.get<{
        type: PermissionTarget;
        requiredBit: PermissionBit;
      }>(PERMISSION_KEY, context.getHandler()) ?? {};

    const request: ExpressRequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    let userWithRole;

    if (type === 'server') {
      userWithRole = await this.getUserServerPermissionsUseCase.execute(
        user.userId,
      );
    } else if (type === 'vm') {
      /* userWithRole = await this.getUserVmPermissionsUseCase.execute(
        user.userId,
      );*/
    } else {
      throw new ForbiddenException('Invalid permission type');
    }

    Logger.log(userWithRole);

    if (!userWithRole) throw new ForbiddenException('No role found');

    const permissionList =
      type === 'server'
        ? userWithRole.permissionServers
        : userWithRole.permissionVms;
    const allowed = permissionList.some((perm) =>
      PermissionUtils.has(perm.bitmask, requiredBit),
    );

    if (!allowed) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
