import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GetServerByIloIpUseCase } from '@/modules/servers/application/use-cases/get-server-by-ilo-ip.use-case';
import { CheckServerPermissionUseCase } from '@/modules/servers/application/use-cases/check-server-permission.use-case';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { User } from '@/modules/users/domain/entities/user.entity';

interface IloPermissionMetadata {
  requiredBit: PermissionBit;
}

export const ILO_PERMISSION_KEY = 'ilo_permission';

@Injectable()
export class IloPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly getServerByIloIpUseCase: GetServerByIloIpUseCase,
    private readonly checkServerPermissionUseCase: CheckServerPermissionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<IloPermissionMetadata>(
      ILO_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      return false;
    }

    const isAdmin = user.roles?.some((role) => role.isAdmin === true);
    if (isAdmin) {
      return true;
    }

    const iloIp = request.params.ip;
    if (!iloIp) {
      throw new ForbiddenException('IP address is required');
    }

    try {
      const server = await this.getServerByIloIpUseCase.execute(iloIp);
      
      const hasPermission = await this.checkServerPermissionUseCase.execute(
        user.id,
        server.id,
        metadata.requiredBit,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to perform this action on this server',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw error;
    }
  }
}