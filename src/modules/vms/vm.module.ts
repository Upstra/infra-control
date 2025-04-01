import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VmController } from './application/vm.controller';
import { VmService } from './application/vm.service';
import { VmDomainService } from './domain/services/vm.domain.service';
import { VmTypeormRepository } from './infrastructure/repositories/vm.typeorm.repository';
import { VM } from './domain/entities/vm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VM])],
  controllers: [VmController],
  providers: [
    VmService,
    VmDomainService,
    {
      provide: 'VmRepositoryInterface',
      useClass: VmTypeormRepository,
    },
  ],
  exports: [VmService],
})
export class VmModule {}
