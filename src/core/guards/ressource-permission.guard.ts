import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

import { PermissionStrategyFactory } from './strategies/permission-strategy.interface';
import {
  RESOURCE_PERMISSION_KEY,
  ResourcePermissionMetadata,
} from '../decorators/ressource-permission.decorator';

@Injectable()
export class ResourcePermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('PermissionStrategyFactory')
    private readonly strategyFactory: PermissionStrategyFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<ResourcePermissionMetadata>(
      RESOURCE_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const resourceId = this.extractResourceId(request, metadata);

    if (!resourceId) {
      throw new BadRequestException(
        `${metadata.resourceType} ID is required for this operation`,
      );
    }

    const strategy = this.strategyFactory.getStrategy(metadata.resourceType);

    const hasPermission = await strategy.checkPermission(
      user.userId,
      resourceId,
      metadata.requiredBit,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You need ${PermissionBit[metadata.requiredBit]} permission on the ${metadata.resourceType}`,
      );
    }

    return true;
  }

  private extractResourceId(
    request: any,
    metadata: ResourcePermissionMetadata,
  ): string | null {
    const source = request[metadata.resourceIdSource];
    return source?.[metadata.resourceIdField] || null;
  }
}
