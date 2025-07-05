import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './application/controllers/dashboard.controller';
import { DashboardLayoutController } from './application/controllers/dashboard-layout.controller';
import { DashboardPreferenceController } from './application/controllers/dashboard-preference.controller';
import { DashboardTemplateController } from './application/controllers/dashboard-template.controller';
import { DashboardWidgetController } from './application/controllers/dashboard-widget.controller';
import { SetupModule } from '../setup/setup.module';
import { RedisModule } from '../redis/redis.module';
import { DashboardUseCases } from './application/use-cases';
import { SetupStatisticsAdapter } from './infrastructure/adapters/setup-statistics.adapters';
import { ServerModule } from '../servers/server.module';
import { PresenceModule } from '../presence/presence.module';
import { VmModule } from '../vms/vm.module';
import { UserModule } from '../users/user.module';
import { RoomModule } from '../rooms/room.module';
import { UpsModule } from '../ups/ups.module';
import { RoleModule } from '../roles/role.module';
import { HistoryModule } from '../history/history.module';
import { AuditModule } from '../audit/audit.module';
import { HealthModule } from '../health/health.module';
import { DashboardLayoutRepository } from './infrastructure/repositories/dashboard-layout.repository';
import { DashboardPreferenceRepository } from './infrastructure/repositories/dashboard-preference.repository';
import { DashboardTemplateRepository } from './infrastructure/repositories/dashboard-template.repository';
import { DashboardRateLimitGuard } from './application/guards/dashboard-rate-limit.guard';
import { DashboardLayoutDomainService } from './domain/services/dashboard-layout.domain.service';
import {
  DashboardLayout,
  DashboardPreference,
  DashboardTemplate,
  DashboardWidget,
} from './domain/entities';

@Module({
  controllers: [
    DashboardController,
    DashboardLayoutController,
    DashboardPreferenceController,
    DashboardTemplateController,
    DashboardWidgetController,
  ],
  providers: [
    ...DashboardUseCases,
    DashboardLayoutRepository,
    DashboardPreferenceRepository,
    DashboardTemplateRepository,
    DashboardLayoutDomainService,
    DashboardRateLimitGuard,
    {
      provide: 'StatisticsPort',
      useClass: SetupStatisticsAdapter,
    },
  ],
  imports: [
    TypeOrmModule.forFeature([
      DashboardLayout,
      DashboardWidget,
      DashboardPreference,
      DashboardTemplate,
    ]),
    forwardRef(() => SetupModule),
    RedisModule,
    ServerModule,
    PresenceModule,
    VmModule,
    UserModule,
    RoomModule,
    forwardRef(() => RoleModule),
    UpsModule,
    HistoryModule,
    AuditModule,
    HealthModule,
  ],
})
export class DashboardModule {}
