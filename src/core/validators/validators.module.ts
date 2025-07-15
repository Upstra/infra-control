import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from '../../modules/servers/domain/entities/server.entity';
import { Vm } from '../../modules/vms/domain/entities/vm.entity';
import { ServerTypeormRepository } from '../../modules/servers/infrastructure/repositories/server.typeorm.repository';
import { VmTypeormRepository } from '../../modules/vms/infrastructure/repositories/vm.typeorm.repository';
import { IsUniqueServerPriorityConstraint } from '../../modules/servers/application/validators/unique-server-priority.validator';
import { IsUniqueVmPriorityConstraint } from '../../modules/vms/application/validators/unique-vm-priority.validator';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Server, Vm])],
  providers: [
    {
      provide: 'ServerRepositoryInterface',
      useClass: ServerTypeormRepository,
    },
    {
      provide: 'VmRepositoryInterface',
      useClass: VmTypeormRepository,
    },
    IsUniqueServerPriorityConstraint,
    IsUniqueVmPriorityConstraint,
  ],
  exports: [
    IsUniqueServerPriorityConstraint,
    IsUniqueVmPriorityConstraint,
  ],
})
export class ValidatorsModule {}