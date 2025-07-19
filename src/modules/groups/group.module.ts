import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './domain/entities/group.entity';
import { Vm } from '../vms/domain/entities/vm.entity';
import { Server } from '../servers/domain/entities/server.entity';
import { GroupRepository } from './infrastructure/repositories/group.repository';
import { GroupController } from './application/controllers/group.controller';
import { CreateGroupUseCase } from './application/use-cases/create-group.use-case';
import { UpdateGroupUseCase } from './application/use-cases/update-group.use-case';
import { DeleteGroupUseCase } from './application/use-cases/delete-group.use-case';
import { GetGroupUseCase } from './application/use-cases/get-group.use-case';
import { ListGroupsUseCase } from './application/use-cases/list-groups.use-case';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Vm, Server]), AuditModule],
  controllers: [GroupController],
  providers: [
    GroupRepository,
    {
      provide: 'GroupRepositoryInterface',
      useClass: GroupRepository,
    },
    CreateGroupUseCase,
    UpdateGroupUseCase,
    DeleteGroupUseCase,
    GetGroupUseCase,
    ListGroupsUseCase,
  ],
  exports: [GroupRepository, 'GroupRepositoryInterface'],
})
export class GroupModule {}
