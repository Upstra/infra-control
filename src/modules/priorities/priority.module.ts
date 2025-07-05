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
} from './application/use-cases';
import { Server } from '../servers/domain/entities/server.entity';
import { Vm } from '../vms/domain/entities/vm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, Vm]),
    ServerModule,
    VmModule,
    PermissionModule,
    AuditModule,
  ],
  controllers: [PriorityController],
  providers: [
    GetServerPrioritiesUseCase,
    GetVmPrioritiesUseCase,
    SwapServerPrioritiesUseCase,
    SwapVmPrioritiesUseCase,
  ],
})
export class PriorityModule {}