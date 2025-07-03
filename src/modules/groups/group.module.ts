import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './domain/entities/group.entity';
import { GroupServer } from './domain/entities/group.server.entity';
import { GroupVm } from './domain/entities/group.vm.entity';

import { GroupServerController } from './application/controllers/group.server.controller';
import { GroupVmController } from './application/controllers/group.vm.controller';
import { GroupShutdownController } from './application/controllers/group.shutdown.controller';

import { GroupServerTypeormRepository } from './infrastructure/repositories/group.server.typeorm.repository';
import { GroupVmTypeormRepository } from './infrastructure/repositories/group.vm.typeorm.repository';
import { GroupServerUseCases } from './application/use-cases/group-server';
import { GroupVmUseCases } from './application/use-cases/group-vm';
import { GroupVmDomainService } from './domain/services/group.vm.domain.service';
import { GroupServerDomainService } from './domain/services/group.server.domain.service';
import { ServerTypeormRepository } from '../servers/infrastructure/repositories/server.typeorm.repository';
import { PreviewShutdownUseCase } from './application/use-cases/preview-shutdown.use-case';
import { ExecuteShutdownUseCase } from './application/use-cases/execute-shutdown.use-case';
import { ToggleCascadeUseCase } from './application/use-cases/toggle-cascade.use-case';
import { AuditModule } from '../audit/audit.module';
import { UserModule } from '../users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupServer, GroupVm]),
    AuditModule,
    forwardRef(() => UserModule),
  ],
  controllers: [
    GroupServerController,
    GroupVmController,
    GroupShutdownController,
  ],
  providers: [
    ...GroupVmUseCases,
    ...GroupServerUseCases,
    PreviewShutdownUseCase,
    ExecuteShutdownUseCase,
    ToggleCascadeUseCase,
    {
      provide: 'GroupServerRepositoryInterface',
      useClass: GroupServerTypeormRepository,
    },
    {
      provide: 'GroupVmRepositoryInterface',
      useClass: GroupVmTypeormRepository,
    },
    {
      provide: 'ServerRepositoryInterface',
      useClass: ServerTypeormRepository,
    },
    GroupServerDomainService,
    GroupVmDomainService,
  ],
  exports: [
    ...GroupVmUseCases,
    ...GroupServerUseCases,
    'GroupServerRepositoryInterface',
    'GroupVmRepositoryInterface',
    'ServerRepositoryInterface',
  ],
})
export class GroupModule {}
