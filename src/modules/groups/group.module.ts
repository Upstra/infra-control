import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './domain/entities/group.entity';
import { GroupServer } from './domain/entities/group.server.entity';
import { GroupVm } from './domain/entities/group.vm.entity';

import { GroupServerController } from './application/controllers/group.server.controller';
import { GroupVmController } from './application/controllers/group.vm.controller';

import { GroupServerTypeormRepository } from './infrastructure/repositories/group.server.typeorm.repository';
import { GroupVmTypeormRepository } from './infrastructure/repositories/group.vm.typeorm.repository';

import { GroupUseCases } from './application/use-cases';
import { GroupServerDomainService } from './domain/services/group.server.domain.service';
import { ServerTypeormRepository } from '../servers/infrastructure/repositories/server.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupServer, GroupVm])],
  controllers: [GroupServerController, GroupVmController],
  providers: [
    ...GroupUseCases,
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
  ],
})
export class GroupModule {}
