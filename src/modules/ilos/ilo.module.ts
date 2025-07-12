import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PythonExecutorModule } from '@/core/services/python-executor';
import { PingModule } from '@/core/services/ping';
import { Ilo } from './domain/entities/ilo.entity';
import { IloTypeormRepository } from './infrastructure/repositories/ilo.typeorm.repository';
import { IloDomainService } from './domain/services/ilo.domain.service';
import { IloPowerService } from './domain/services/ilo-power.service';

import { GetIloByIdUseCase } from './application/use-cases/get-ilo-by-id.use-case';
import { CreateIloUseCase } from './application/use-cases/create-ilo.use-case';
import { UpdateIloUseCase } from './application/use-cases/update-ilo.use-case';
import { DeleteIloUseCase } from './application/use-cases/delete-ilo.use-case';
import { ControlServerPowerUseCase } from './application/use-cases/control-server-power.use-case';
import { GetServerStatusUseCase } from './application/use-cases/get-server-status.use-case';
import { PingIloUseCase } from './application/use-cases/ping-ilo.use-case';

import { IloPowerController } from './application/controllers/ilo-power.controller';
import { ServerModule } from '../servers/server.module';
import { VmwareModule } from '../vmware/vmware.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ilo]),
    PythonExecutorModule,
    PingModule,
    forwardRef(() => ServerModule),
    forwardRef(() => VmwareModule),
  ],
  controllers: [IloPowerController],
  providers: [
    IloDomainService,
    IloPowerService,
    GetIloByIdUseCase,
    CreateIloUseCase,
    UpdateIloUseCase,
    DeleteIloUseCase,
    ControlServerPowerUseCase,
    GetServerStatusUseCase,
    PingIloUseCase,
    {
      provide: 'IloRepositoryInterface',
      useClass: IloTypeormRepository,
    },
  ],
  exports: [
    CreateIloUseCase,
    UpdateIloUseCase,
    DeleteIloUseCase,
    IloPowerService,
  ],
})
export class IloModule {}
