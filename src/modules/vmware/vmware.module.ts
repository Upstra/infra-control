import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { PythonExecutorModule } from '@/core/services/python-executor/python-executor.module';
import { YamlConfigModule } from '@/core/services/yaml-config/yaml-config.module';
import { VmwareController } from './application/controllers/vmware.controller';
import { MigrationDestinationsController } from './application/controllers/migration-destinations.controller';
import { VmwareService } from './domain/services/vmware.service';
import { MigrationOrchestratorService } from './domain/services/migration-orchestrator.service';
import { ListVmsUseCase } from './application/use-cases/list-vms.use-case';
import { ListServersUseCase } from './application/use-cases/list-servers.use-case';
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
import { GenerateMigrationPlanWithDestinationUseCase } from './application/use-cases/generate-migration-plan-with-destination.use-case';
import { GetMigrationDestinationsUseCase } from './application/use-cases/get-migration-destinations.use-case';
import { RemoveMigrationDestinationUseCase } from './application/use-cases/remove-migration-destination.use-case';
import { GetVmsForMigrationUseCase } from './application/use-cases/get-vms-for-migration.use-case';
import { SyncServerVmwareDataUseCase } from './application/use-cases/sync-server-vmware-data.use-case';
import { VmwareDiscoveryGateway } from './application/gateway/vmware-discovery.gateway';
import { MigrationGateway } from './application/gateway/migration.gateway';
import { VmwareDiscoveryService } from './domain/services/vmware-discovery.service';
import { DiscoverySessionService } from './domain/services/discovery-session.service';
import { ServerModule } from '@/modules/servers/server.module';
import { VmModule } from '@/modules/vms/vm.module';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';
import { PermissionModule } from '@/modules/permissions/permission.module';
import { RedisModule } from '@/modules/redis/redis.module';
import { PresenceModule } from '@/modules/presence/presence.module';
import { HistoryModule } from '@/modules/history/history.module';
import { jwtConfig } from '@/core/config/jwt.config';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    JwtModule.registerAsync(jwtConfig()),
    PythonExecutorModule,
    YamlConfigModule,
    TypeOrmModule.forFeature([Server, Vm, Ilo, Ups]),
    forwardRef(() => ServerModule),
    forwardRef(() => VmModule),
    PermissionModule,
    RedisModule,
    PresenceModule,
    HistoryModule,
  ],
  controllers: [VmwareController, MigrationDestinationsController],
  providers: [
    VmwareService,
    VmwareDiscoveryService,
    DiscoverySessionService,
    MigrationOrchestratorService,
    VmwareDiscoveryGateway,
    MigrationGateway,
    ListVmsUseCase,
    ListServersUseCase,
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
    GenerateMigrationPlanWithDestinationUseCase,
    GetMigrationDestinationsUseCase,
    RemoveMigrationDestinationUseCase,
    GetVmsForMigrationUseCase,
    SyncServerVmwareDataUseCase,
  ],
  exports: [
    VmwareService,
    VmwareDiscoveryService,
    VmwareDiscoveryGateway,
    MigrationOrchestratorService,
  ],
})
export class VmwareModule {}
