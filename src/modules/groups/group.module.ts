import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './domain/entities/group.entity';
import { GroupServer } from './domain/entities/group.server.entity';
import { GroupVm } from './domain/entities/group.vm.entity';

import { GroupServerController } from './application/controllers/group.server.controller';
import { GroupVmController } from './application/controllers/group.vm.controller';

import { GroupServerTypeormRepository } from './infrastructure/repositories/group.server.typeorm.repository';
import { GroupVmTypeormRepository } from './infrastructure/repositories/group.vm.typeorm.repository';

import { CreateGroupVmUseCase } from './application/use-cases/group-vm/create-group-vm.use-case';
import { GetAllGroupVmUseCase } from './application/use-cases/group-vm/get-all-group-vm.use-case';
import { UpdateGroupVmUseCase } from './application/use-cases/group-vm/update-group-vm.use-case';
import { DeleteGroupVmUseCase } from './application/use-cases/group-vm/delete-group-vm.use-case';
import { GetGroupVmByIdUseCase } from './application/use-cases/group-vm/get-group-vm-by-id.use-case';

import { CreateGroupServerUseCase } from './application/use-cases/group-server/create-group-server.use-case';
import { GetAllGroupServerUseCase } from './application/use-cases/group-server/get-all-group-server.use-case';
import { UpdateGroupServerUseCase } from './application/use-cases/group-server/update-group-server.use-case';
import { DeleteGroupServerUseCase } from './application/use-cases/group-server/delete-group-server.use-case';
import { GetGroupServerByIdUseCase } from './application/use-cases/group-server/get-group-server-by-id.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupServer, GroupVm])],
  controllers: [GroupServerController, GroupVmController],
  providers: [
    CreateGroupVmUseCase,
    GetAllGroupVmUseCase,
    UpdateGroupVmUseCase,
    DeleteGroupVmUseCase,
    GetGroupVmByIdUseCase,
    CreateGroupServerUseCase,
    GetAllGroupServerUseCase,
    GetGroupServerByIdUseCase,
    UpdateGroupServerUseCase,
    DeleteGroupServerUseCase,
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
export class GroupModule { }
