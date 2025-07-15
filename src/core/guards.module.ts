import { Module, Global, forwardRef } from '@nestjs/common';

import { PermissionGuard } from '@/core/guards';
import { RoleGuard } from '@/core/guards';

import { ServerPermissionStrategy } from '@/core/guards';
import { PermissionStrategyFactoryImpl } from '@/core/guards';
import { UserModule } from '@/modules/users/user.module';
import { PermissionModule } from '@/modules/permissions/permission.module';
import { ResourcePermissionGuard } from '@/core/guards';

@Global()
@Module({
  imports: [PermissionModule, forwardRef(() => UserModule)],
  providers: [
    PermissionGuard,
    RoleGuard,
    ResourcePermissionGuard,
    ServerPermissionStrategy,
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
