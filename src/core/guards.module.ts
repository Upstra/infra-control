import { Module, Global, forwardRef } from '@nestjs/common';

import { PermissionGuard } from './guards/permission.guard';
import { RoleGuard } from './guards/role.guard';

import { ServerPermissionStrategy } from './guards/strategies/server-permission.strategy';
import { VmPermissionStrategy } from './guards/strategies/vm-permission.strategy';
import { PermissionStrategyFactoryImpl } from './guards/strategies/permission-strategy.factory';
import { UserModule } from '@/modules/users/user.module';
import { PermissionModule } from '@/modules/permissions/permission.module';
import { ResourcePermissionGuard } from './guards/ressource-permission.guard';

@Global()
@Module({
  imports: [PermissionModule, forwardRef(() => UserModule)],
  providers: [
    PermissionGuard,
    RoleGuard,
    ResourcePermissionGuard,
    ServerPermissionStrategy,
    VmPermissionStrategy,
    {
      provide: 'PermissionStrategyFactory',
      useClass: PermissionStrategyFactoryImpl,
    },
  ],
  exports: [
    PermissionGuard,
    RoleGuard,
    ResourcePermissionGuard,
    'PermissionStrategyFactory',
  ],
})
export class GuardsModule {}
