import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VmController } from './application/controllers/vm.controller';
import { VmTypeormRepository } from './infrastructure/repositories/vm.typeorm.repository';
import { Vm } from './domain/entities/vm.entity';
import { VmDomainService } from './domain/services/vm.domain.service';
import { VmUseCase } from './application/use-cases';
import { ServerModule } from '../servers/server.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  controllers: [VmController],
  exports: [...VmUseCase, 'VmRepositoryInterface'],
  imports: [
    TypeOrmModule.forFeature([Vm]),
    forwardRef(() => ServerModule),
    AuditModule,
  ],
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
