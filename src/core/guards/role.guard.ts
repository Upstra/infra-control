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

    const user = this.extractUserFromContext(context);
    const userWithRole = await this.getUserWithRoleUseCase.execute(user.userId);

    this.validateUserRoles(userWithRole);
    this.checkAdminRequirement(requirement, userWithRole);
    this.checkServerCreationRequirement(requirement, userWithRole);

    return true;
  }

  private extractUserFromContext(context: ExecutionContext): JwtPayload {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    return user;
  }

  private validateUserRoles(userWithRole: any): void {
    if (!userWithRole?.roles?.length) {
      throw new ForbiddenException('User has no role assigned');
    }
  }

  private checkAdminRequirement(
    requirement: RoleRequirement,
    userWithRole: any,
  ): void {
    if (requirement.isAdmin !== undefined) {
      const isAdmin = userWithRole.roles.some((r) => r.isAdmin === true);
      if (requirement.isAdmin && !isAdmin) {
        throw new ForbiddenException('This action requires admin privileges');
      }
      if (!requirement.isAdmin && isAdmin) {
        throw new ForbiddenException(
          'This action requires non-admin privileges',
        );
      }
    }
  }

  private checkServerCreationRequirement(
    requirement: RoleRequirement,
    userWithRole: any,
  ): void {
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
  }
}
