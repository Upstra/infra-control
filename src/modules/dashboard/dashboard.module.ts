import { Module } from '@nestjs/common';
import { DashboardController } from './application/controllers/dashboard.controller';
import { DashboardService } from './domain/services/dashboard.service';
import { SetupStatisticsService } from './domain/services/setupStatistics.service';
import { SetupStatusService } from './domain/services/setupStatus.service';
import { PresenceService } from '../presence/application/services/presence.service';
import { ServerTypeormRepository } from '../servers/infrastructure/repositories/server.typeorm.repository';
import { VmTypeormRepository } from '../vms/infrastructure/repositories/vm.typeorm.repository';
import { SetupProgressRepository } from './infrastructure/repositories/setupProgress.repository';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    SetupStatisticsService,
    SetupStatusService,
    PresenceService,
    ServerTypeormRepository,
    VmTypeormRepository,
    SetupProgressRepository,
  ],
})
export class DashboardModule {}
