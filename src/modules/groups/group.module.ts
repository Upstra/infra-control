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

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupServer, GroupVm])],
  controllers: [GroupServerController, GroupVmController],
  providers: [
    ...GroupUseCases,
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
