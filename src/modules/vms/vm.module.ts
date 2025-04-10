import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VmController } from './application/controllers/vm.controller';
import { VmService } from './application/services/vm.service';
import { VmTypeormRepository } from './infrastructure/repositories/vm.typeorm.repository';
import { Vm } from './domain/entities/vm.entity';
import { VmDomainService } from './vm.domain.service';

@Module({
  controllers: [VmController],
  exports: [VmService],
  imports: [TypeOrmModule.forFeature([Vm])],
  providers: [
    VmService,
    VmDomainService,
    {
      provide: 'VmRepositoryInterface',
      useClass: VmTypeormRepository,
    },
  ],
})
export class VmModule { }
