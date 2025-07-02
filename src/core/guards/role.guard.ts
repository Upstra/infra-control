import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY, RoleRequirement } from '@/core/decorators/role.decorator';
import { GetUserWithRoleUseCase } from '@/modules/users/application/use-cases/get-user-with-role.use-case';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly getUserWithRoleUseCase: GetUserWithRoleUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.get<RoleRequirement>(
      ROLE_KEY,
      context.getHandler(),
    );

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userWithRole = await this.getUserWithRoleUseCase.execute(user.userId);

    if (!userWithRole?.roles?.length) {
      throw new ForbiddenException('User has no role assigned');
    }

    if (requirement.canCreateServer !== undefined) {
      const hasPerm = userWithRole.roles.some(
        (r) => r.canCreateServer === requirement.canCreateServer,
      );
      if (!hasPerm) {
        throw new ForbiddenException(
          requirement.canCreateServer
            ? 'You do not have permission to create servers'
            : 'This action requires NOT having server creation permission',
        );
      }
    }
    /*
    if (requirement.canCreateVm !== undefined) {
      if (userWithRole.role.canCreateVm !== requirement.canCreateVm) {
        throw new ForbiddenException(
          requirement.canCreateVm
            ? 'You do not have permission to create VMs'
            : 'This action requires NOT having VM creation permission',
        );
      }
    }*/

    return true;
  }
}
