import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VmController } from './application/controllers/vm.controller';
import { VmTypeormRepository } from './infrastructure/repositories/vm.typeorm.repository';
import { Vm } from './domain/entities/vm.entity';
import { VmDomainService } from './domain/services/vm.domain.service';
import { VmUseCase } from './application/use-cases';

@Module({
  controllers: [VmController],
  exports: [...VmUseCase, 'VmRepositoryInterface'],
  imports: [TypeOrmModule.forFeature([Vm])],
  providers: [
    ...VmUseCase,
    VmDomainService,
    {
      provide: 'VmRepositoryInterface',
      useClass: VmTypeormRepository,
    },
  ],
})
export class VmModule {}
