import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalleController } from './application/salle.controller';
import { SalleService } from './application/salle.service';
import { Salle } from './domain/entities/salle.entity';
import { SalleDomainService } from './domain/services/salle.domain.service';
import { SalleTypeormRepository } from './infrastructure/repositories/salles.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Salle])],
  controllers: [SalleController],
  providers: [
    SalleService,
    SalleDomainService,
    {
      provide: 'SalleRepositoryInterface',
      useClass: SalleTypeormRepository,
    },
  ],
  exports: [SalleService],
})
export class SallesModule {}
