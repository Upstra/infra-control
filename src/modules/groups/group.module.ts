import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './domain/entities/group.entity';
import { GroupServerDomainService } from './domain/services/group.server.domain.service';
import { GroupServerTypeormRepository } from './infrastructure/repositories/group.server.typeorm.repository';
import { GroupServer } from './domain/entities/group.server.entity';
import { GroupVm } from './domain/entities/group.vm.entity';
import { GroupServerController } from './application/controllers/group.server.controller';
import { GroupVmController } from './application/controllers/group.vm.controller';
import { GroupServerService } from './application/services/group.server.service';
import { GroupVmService } from './application/services/group.vm.service';
import { GroupVmDomainService } from './domain/services/group.vm.domain.service';
import { GroupVmTypeormRepository } from './infrastructure/repositories/group.vm.typeorm.repository';

@Module({
  controllers: [GroupServerController, GroupVmController],
  exports: [GroupServerService, GroupVmService],
  imports: [TypeOrmModule.forFeature([Group, GroupServer, GroupVm])],
  providers: [
    GroupServerService,
    GroupVmService,
    GroupServerDomainService,
    GroupVmDomainService,
    {
      provide: 'GroupRepositoryInterface',
      useClass: GroupServerTypeormRepository,
    },
    {
      provide: 'GroupRepositoryInterface',
      useClass: GroupVmTypeormRepository,
    },
  ],
})
export class GroupModule {}
