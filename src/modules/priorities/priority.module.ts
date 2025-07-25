import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerModule } from '../servers/server.module';
import { VmModule } from '../vms/vm.module';
import { PermissionModule } from '../permissions/permission.module';
import { AuditModule } from '../audit/audit.module';
import { PriorityController } from './application/controllers/priority.controller';
import {
  GetServerPrioritiesUseCase,
  GetVmPrioritiesUseCase,
  SwapServerPrioritiesUseCase,
  SwapVmPrioritiesUseCase,
  GenerateMigrationPlanUseCase,
} from './application/use-cases';
import { Server } from '../servers/domain/entities/server.entity';
import { Vm } from '../vms/domain/entities/vm.entity';
import { Ilo } from '../ilos/domain/entities/ilo.entity';
import { Ups } from '../ups/domain/entities/ups.entity';
import { YamlConfigModule } from '@/core/services/yaml-config/yaml-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, Vm, Ilo, Ups]),
    ServerModule,
    VmModule,
    PermissionModule,
    AuditModule,
    YamlConfigModule,
  ],
  controllers: [PriorityController],
  providers: [
    GetServerPrioritiesUseCase,
    GetVmPrioritiesUseCase,
    SwapServerPrioritiesUseCase,
    SwapVmPrioritiesUseCase,
    GenerateMigrationPlanUseCase,
  ],
})
export class PriorityModule {}
