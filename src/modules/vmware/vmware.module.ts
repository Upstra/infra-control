import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PythonExecutorModule } from '@/core/services/python-executor/python-executor.module';
import { VmwareController } from './application/controllers/vmware.controller';
import { VmwareService } from './domain/services/vmware.service';
import { ListVmsUseCase } from './application/use-cases/list-vms.use-case';
import { GetVmMetricsUseCase } from './application/use-cases/get-vm-metrics.use-case';
import { ControlVmPowerUseCase } from './application/use-cases/control-vm-power.use-case';
import { MigrateVmUseCase } from './application/use-cases/migrate-vm.use-case';
import { GetHostMetricsUseCase } from './application/use-cases/get-host-metrics.use-case';
import { StartVMDiscoveryUseCase } from './application/use-cases/start-vm-discovery.use-case';
import { SaveDiscoveredVmsUseCase } from './application/use-cases/save-discovered-vms.use-case';
import { VmwareDiscoveryGateway } from './application/gateway/vmware-discovery.gateway';
import { VmwareDiscoveryService } from './domain/services/vmware-discovery.service';
import { ServerModule } from '@/modules/servers/server.module';
import { VmModule } from '@/modules/vms/vm.module';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { PermissionModule } from '@/modules/permissions/permission.module';

@Module({
  imports: [
    ConfigModule,
    PythonExecutorModule,
    TypeOrmModule.forFeature([Server]),
    forwardRef(() => ServerModule),
    forwardRef(() => VmModule),
    PermissionModule,
  ],
  controllers: [VmwareController],
  providers: [
    VmwareService,
    VmwareDiscoveryService,
    VmwareDiscoveryGateway,
    ListVmsUseCase,
    GetVmMetricsUseCase,
    ControlVmPowerUseCase,
    MigrateVmUseCase,
    GetHostMetricsUseCase,
    StartVMDiscoveryUseCase,
    SaveDiscoveredVmsUseCase,
  ],
  exports: [VmwareService, VmwareDiscoveryService, VmwareDiscoveryGateway],
})
export class VmwareModule {}
