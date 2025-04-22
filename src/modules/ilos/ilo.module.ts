import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ilo } from './domain/entities/ilo.entity';
import { IloTypeormRepository } from './infrastructure/repositories/ilo.typeorm.repository';
import { IloDomainService } from './domain/services/ilo.domain.service';

import { GetIloByIdUseCase } from './application/use-cases/get-ilo-by-id.use-case';
import { CreateIloUseCase } from './application/use-cases/create-ilo.use-case';
import { UpdateIloUseCase } from './application/use-cases/update-ilo.use-case';
import { DeleteIloUseCase } from './application/use-cases/delete-ilo.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Ilo])],
  providers: [
    IloDomainService,
    GetIloByIdUseCase,
    CreateIloUseCase,
    UpdateIloUseCase,
    DeleteIloUseCase,
    {
      provide: 'IloRepositoryInterface',
      useClass: IloTypeormRepository,
    },
  ],
  exports: [CreateIloUseCase, UpdateIloUseCase, DeleteIloUseCase],
})
export class IloModule {}
