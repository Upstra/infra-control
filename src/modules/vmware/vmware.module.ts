import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PythonExecutorModule } from '@/core/services/python-executor/python-executor.module';
import { VmwareController } from './application/controllers/vmware.controller';
import { VmwareService } from './domain/services/vmware.service';
import { ListVmsUseCase } from './application/use-cases/list-vms.use-case';
import { GetVmMetricsUseCase } from './application/use-cases/get-vm-metrics.use-case';
import { ControlVmPowerUseCase } from './application/use-cases/control-vm-power.use-case';
import { MigrateVmUseCase } from './application/use-cases/migrate-vm.use-case';
import { GetHostMetricsUseCase } from './application/use-cases/get-host-metrics.use-case';

@Module({
  imports: [ConfigModule, PythonExecutorModule],
  controllers: [VmwareController],
  providers: [
    VmwareService,
    ListVmsUseCase,
    GetVmMetricsUseCase,
    ControlVmPowerUseCase,
    MigrateVmUseCase,
    GetHostMetricsUseCase,
  ],
  exports: [VmwareService],
})
export class VmwareModule {}