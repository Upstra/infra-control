import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PythonExecutorModule } from '@/core/services/python-executor';
import { Ilo } from './domain/entities/ilo.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission_server.entity';
import { IloTypeormRepository } from './infrastructure/repositories/ilo.typeorm.repository';
import { IloDomainService } from './domain/services/ilo.domain.service';
import { IloPowerService } from './domain/services/ilo-power.service';
import { IloPermissionGuard } from './infrastructure/guards/ilo-permission.guard';

import { GetIloByIdUseCase } from './application/use-cases/get-ilo-by-id.use-case';
import { CreateIloUseCase } from './application/use-cases/create-ilo.use-case';
import { UpdateIloUseCase } from './application/use-cases/update-ilo.use-case';
import { DeleteIloUseCase } from './application/use-cases/delete-ilo.use-case';
import { ControlServerPowerUseCase } from './application/use-cases/control-server-power.use-case';
import { GetServerStatusUseCase } from './application/use-cases/get-server-status.use-case';

import { IloPowerController } from './application/controllers/ilo-power.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ilo, Server, PermissionServer]),
    PythonExecutorModule,
  ],
  controllers: [IloPowerController],
  providers: [
    IloDomainService,
    IloPowerService,
    IloPermissionGuard,
    GetIloByIdUseCase,
    CreateIloUseCase,
    UpdateIloUseCase,
    DeleteIloUseCase,
    ControlServerPowerUseCase,
    GetServerStatusUseCase,
    {
      provide: 'IloRepositoryInterface',
      useClass: IloTypeormRepository,
    },
  ],
  exports: [CreateIloUseCase, UpdateIloUseCase, DeleteIloUseCase, IloPowerService],
})
export class IloModule {}
