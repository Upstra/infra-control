import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpsController } from './application/controllers/ups.controller';
import { Ups } from './domain/entities/ups.entity';
import { UpsTypeormRepository } from './infrastructure/repositories/ups.typeorm.repository';
import { UpsUseCases } from './application/use-cases';
import { UpsDomainService } from './domain/services/ups.domain.service';
import { HistoryModule } from '../history/history.module';

@Module({
  controllers: [UpsController],
  exports: [...UpsUseCases, 'UpsRepositoryInterface'],
  imports: [TypeOrmModule.forFeature([Ups]), HistoryModule],
  providers: [
    ...UpsUseCases,
    UpsDomainService,
    {
      provide: 'UpsRepositoryInterface',
      useClass: UpsTypeormRepository,
    },
  ],
})
export class UpsModule {}
