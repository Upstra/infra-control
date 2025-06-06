import { Injectable } from '@nestjs/common';
import {
  PermissionCheckStrategy,
  PermissionStrategyFactory,
} from './permission-strategy.interface';
import { ServerPermissionStrategy } from './server-permission.strategy';
import { VmPermissionStrategy } from './vm-permission.strategy';

@Injectable()
export class PermissionStrategyFactoryImpl
  implements PermissionStrategyFactory
{
  constructor(
    private readonly serverStrategy: ServerPermissionStrategy,
    private readonly vmStrategy: VmPermissionStrategy,
  ) {}

  getStrategy(resourceType: string): PermissionCheckStrategy {
    switch (resourceType) {
      case 'server':
        return this.serverStrategy;
      case 'vm':
        return this.vmStrategy;
      default:
        throw new Error(
          `Unknown resource type: ${resourceType}. Available types: server, vm`,
        );
    }
  }
}
