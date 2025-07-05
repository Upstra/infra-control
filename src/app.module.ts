import { configModule } from './core/config/config.module';
import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './core/config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { GroupModule } from './modules/groups/group.module';
import { IloModule } from './modules/ilos/ilo.module';
import { PermissionModule } from './modules/permissions/permission.module';
import { RoleModule } from './modules/roles/role.module';
import { RoomModule } from './modules/rooms/room.module';
import { ServerModule } from './modules/servers/server.module';
import { UpsModule } from './modules/ups/ups.module';
import { UserModule } from './modules/users/user.module';
import { VmModule } from './modules/vms/vm.module';
import { RedisModule } from './modules/redis/redis.module';
import { PresenceModule } from './modules/presence/presence.module';
import { GuardsModule } from './core/guards.module';
import { SetupModule } from './modules/setup/setup.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HistoryModule } from './modules/history/history.module';
import { SshModule } from './modules/ssh';
import { ReleasesModule } from './modules/releases/releases.module';
import { HealthModule } from './modules/health/health.module';
import { PriorityModule } from './modules/priorities/priority.module';
import { PrometheusModule } from './modules/prometheus/prometheus.module';

@Module({
  controllers: [],
  imports: [
    configModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    GuardsModule,
    AuthModule,
    GroupModule,
    IloModule,
    PermissionModule,
    UpsModule,
    RoleModule,
    RoomModule,
    ServerModule,
    UserModule,
    VmModule,
    RedisModule,
    PresenceModule,
    SetupModule,
    HistoryModule,
    DashboardModule,
    SshModule,
    ReleasesModule,
    HealthModule,
    PriorityModule,
    PrometheusModule,
  ],
  providers: [Logger],
})
export class AppModule {}
