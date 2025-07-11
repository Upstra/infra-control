import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CheckServerPermissionUseCase } from '@/modules/servers/application/use-cases/check-server-permission.use-case';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { User } from '@/modules/users/domain/entities/user.entity';
import { GetServerByVmMoidUseCase } from '../use-cases/get-server-by-vm-moid.use-case';

interface VmwarePermissionMetadata {
  requiredBit: PermissionBit;
}

export const VMWARE_PERMISSION_KEY = 'vmware_permission';

@Injectable()
export class VmwarePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly getServerByVmMoidUseCase: GetServerByVmMoidUseCase,
    private readonly checkServerPermissionUseCase: CheckServerPermissionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<VmwarePermissionMetadata>(
      VMWARE_PERMISSION_KEY,
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

    const vmMoid = this.extractVmMoid(request);
    if (!vmMoid) {
      throw new ForbiddenException('VM MOID is required');
    }

    const connectionParams = this.extractConnectionParams(request);

    try {
      const server = await this.getServerByVmMoidUseCase.execute(
        vmMoid,
        connectionParams,
      );

      const hasPermission = await this.checkServerPermissionUseCase.execute(
        user.id,
        server.id,
        metadata.requiredBit,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to perform this action on this VM',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ForbiddenException('Failed to verify permissions');
    }
  }

  private extractVmMoid(request: any): string | null {
    return request.params?.moid || request.body?.moid || null;
  }

  private extractConnectionParams(request: any): {
    ip: string;
    user: string;
    password: string;
    port?: number;
  } {
    const query = request.query || {};
    const body = request.body || {};

    return {
      ip: query.ip || body.ip,
      user: query.user || body.user,
      password: query.password || body.password,
      port: query.port || body.port,
    };
  }
}