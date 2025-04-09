import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IloService } from './application/services/ilo.service';
import { Ilo } from './domain/entities/ilo.entity';
import { IloTypeormRepository } from './infrastructure/repositories/ilo.typeorm.repository';
import { IloDomainService } from './domain/services/ilo.domain.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ilo])],
  providers: [
    IloService,
    IloDomainService,
    {
      provide: 'IloRepositoryInterface',
      useClass: IloTypeormRepository,
    },
  ],
  exports: [IloService],
})
export class IloModule {}
