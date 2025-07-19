import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Inject,
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
import { GetUserVmPermissionsUseCase } from '@/modules/permissions/application/use-cases/permission-vm';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly getUserServerPermissionsUseCase: GetUserServerPermissionsUseCase,
    private readonly getUserVmPermissionsUseCase: GetUserVmPermissionsUseCase,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { type, requiredBit } =
      this.reflector.get<{
        type: PermissionTarget;
        requiredBit: PermissionBit;
      }>(PERMISSION_KEY, context.getHandler()) ?? {};

    const request: ExpressRequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    const fullUser = await this.userRepository.findOneByField({
      field: 'id',
      value: user.userId,
      relations: ['roles'],
    });

    const isAdmin = fullUser?.roles?.some((role) => role.isAdmin) ?? false;
    if (isAdmin) {
      return true;
    }

    let userWithRole;

    if (type === 'server') {
      userWithRole = await this.getUserServerPermissionsUseCase.execute(
        user.userId,
      );
    } else if (type === 'vm') {
      userWithRole = await this.getUserVmPermissionsUseCase.execute(
        user.userId,
      );
    } else {
      throw new ForbiddenException('Invalid permission type');
    }

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
