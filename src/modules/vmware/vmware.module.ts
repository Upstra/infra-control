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
import { VmwarePermissionGuard } from './infrastructure/guards/vmware-permission.guard';
import { GetServerByVmMoidUseCase } from './infrastructure/use-cases/get-server-by-vm-moid.use-case';
import { ServerModule } from '@/modules/servers/server.module';
import { Server } from '@/modules/servers/domain/entities/server.entity';

@Module({
  imports: [
    ConfigModule,
    PythonExecutorModule,
    TypeOrmModule.forFeature([Server]),
    forwardRef(() => ServerModule),
  ],
  controllers: [VmwareController],
  providers: [
    VmwareService,
    VmwarePermissionGuard,
    ListVmsUseCase,
    GetVmMetricsUseCase,
    ControlVmPowerUseCase,
    MigrateVmUseCase,
    GetHostMetricsUseCase,
    GetServerByVmMoidUseCase,
  ],
  exports: [VmwareService],
})
export class VmwareModule {}