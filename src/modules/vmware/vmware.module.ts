import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PythonExecutorModule } from '@/core/services/python-executor/python-executor.module';
import { VmwareController } from './application/controllers/vmware.controller';
import { VmwareService } from './domain/services/vmware.service';
import { MigrationOrchestratorService } from './domain/services/migration-orchestrator.service';
import { ListVmsUseCase } from './application/use-cases/list-vms.use-case';
import { GetVmMetricsUseCase } from './application/use-cases/get-vm-metrics.use-case';
import { ControlVmPowerUseCase } from './application/use-cases/control-vm-power.use-case';
import { MigrateVmUseCase } from './application/use-cases/migrate-vm.use-case';
import { GetHostMetricsUseCase } from './application/use-cases/get-host-metrics.use-case';
import { StartVMDiscoveryUseCase } from './application/use-cases/start-vm-discovery.use-case';
import { SaveDiscoveredVmsUseCase } from './application/use-cases/save-discovered-vms.use-case';
import { GetActiveDiscoverySessionUseCase } from './application/use-cases/get-active-discovery-session.use-case';
import { GetDiscoverySessionUseCase } from './application/use-cases/get-discovery-session.use-case';
import { ExecuteMigrationPlanUseCase } from './application/use-cases/execute-migration-plan.use-case';
import { ExecuteRestartPlanUseCase } from './application/use-cases/execute-restart-plan.use-case';
import { GetMigrationStatusUseCase } from './application/use-cases/get-migration-status.use-case';
import { ClearMigrationDataUseCase } from './application/use-cases/clear-migration-data.use-case';
import { VmwareDiscoveryGateway } from './application/gateway/vmware-discovery.gateway';
import { MigrationGateway } from './application/gateway/migration.gateway';
import { VmwareDiscoveryService } from './domain/services/vmware-discovery.service';
import { DiscoverySessionService } from './domain/services/discovery-session.service';
import { ServerModule } from '@/modules/servers/server.module';
import { VmModule } from '@/modules/vms/vm.module';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { PermissionModule } from '@/modules/permissions/permission.module';
import { RedisModule } from '@/modules/redis/redis.module';
import { PresenceModule } from '@/modules/presence/presence.module';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    PythonExecutorModule,
    TypeOrmModule.forFeature([Server]),
    forwardRef(() => ServerModule),
    forwardRef(() => VmModule),
    PermissionModule,
    RedisModule,
    PresenceModule,
  ],
  controllers: [VmwareController],
  providers: [
    VmwareService,
    VmwareDiscoveryService,
    DiscoverySessionService,
    MigrationOrchestratorService,
    VmwareDiscoveryGateway,
    MigrationGateway,
    ListVmsUseCase,
    GetVmMetricsUseCase,
    ControlVmPowerUseCase,
    MigrateVmUseCase,
    GetHostMetricsUseCase,
    StartVMDiscoveryUseCase,
    SaveDiscoveredVmsUseCase,
    GetActiveDiscoverySessionUseCase,
    GetDiscoverySessionUseCase,
    ExecuteMigrationPlanUseCase,
    ExecuteRestartPlanUseCase,
    GetMigrationStatusUseCase,
    ClearMigrationDataUseCase,
  ],
  exports: [VmwareService, VmwareDiscoveryService, VmwareDiscoveryGateway, MigrationOrchestratorService],
})
export class VmwareModule {}
