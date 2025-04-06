import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VmController } from './application/vm.controller';
import { VmService } from './application/vm.service';
import { VmDomainService } from './domain/services/vm.domain.service';
import { VmTypeormRepository } from './infrastructure/repositories/vm.typeorm.repository';
import { Vm } from './domain/entities/vm.entity';

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
export class VmModule {}
