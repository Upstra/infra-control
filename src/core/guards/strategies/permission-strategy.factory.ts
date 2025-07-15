import { Injectable } from '@nestjs/common';
import {
  PermissionCheckStrategy,
  PermissionStrategyFactory,
} from '@/core/guards';
import { ServerPermissionStrategy } from '@/core/guards';

@Injectable()
export class PermissionStrategyFactoryImpl
  implements PermissionStrategyFactory
{
  constructor(private readonly serverStrategy: ServerPermissionStrategy) {}

  getStrategy(resourceType: string): PermissionCheckStrategy {
    switch (resourceType) {
      case 'server':
        return this.serverStrategy;
      default:
        throw new Error(
          `Unknown resource type: ${resourceType}. Available types: server, vm`,
        );
    }
  }
}
