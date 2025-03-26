import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IloController } from './application/ilo.controller';
import { IloService } from './application/ilo.service';
import { Ilo } from './domain/entities/ilo.entity';
import { IloDomainService } from './domain/services/ilo.domain.service';
import { IloTypeormRepository } from './infrastructure/repositories/ilos.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Ilo])],
  controllers: [IloController],
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
export class IlosModule {}
