import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryEvent } from '../history/domain/entities/history-event.entity';
import { HistoryEventTypeormRepository } from '../history/infrastructure/repositories/history-event.typeorm.repository';
import { LogHistoryUseCase } from '../history/application/use-cases/log-history.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([HistoryEvent])],
  providers: [
    LogHistoryUseCase,
    {
      provide: 'HistoryRepositoryInterface',
      useClass: HistoryEventTypeormRepository,
    },
  ],
  exports: [LogHistoryUseCase, 'HistoryRepositoryInterface'],
})
export class AuditModule {}
