import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryEvent } from './domain/entities/history-event.entity';
import { HistoryEventTypeormRepository } from './infrastructure/repositories/history-event.typeorm.repository';
import { GetHistoryStatsUseCase, LogHistoryUseCase } from './application/use-cases';

@Module({
  imports: [TypeOrmModule.forFeature([HistoryEvent])],
  providers: [
    LogHistoryUseCase,
    GetHistoryStatsUseCase,
    {
      provide: 'HistoryRepositoryInterface',
      useClass: HistoryEventTypeormRepository,
    },
  ],
  exports: [LogHistoryUseCase, GetHistoryStatsUseCase, 'HistoryRepositoryInterface'],
})
export class HistoryModule {}
