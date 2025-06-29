import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryEvent } from './domain/entities/history-event.entity';
import { HistoryEventTypeormRepository } from './infrastructure/repositories/history-event.typeorm.repository';
import {
  GetHistoryStatsUseCase,
  LogHistoryUseCase,
  GetHistoryListUseCase,
} from './application/use-cases';
import { HistoryController } from './application/controllers/history.controller';
import { UserModule } from '../users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoryEvent]),
    forwardRef(() => UserModule),
  ],
  controllers: [HistoryController],
  providers: [
    LogHistoryUseCase,
    GetHistoryStatsUseCase,
    GetHistoryListUseCase,
    {
      provide: 'HistoryRepositoryInterface',
      useClass: HistoryEventTypeormRepository,
    },
  ],
  exports: [
    LogHistoryUseCase,
    GetHistoryStatsUseCase,
    GetHistoryListUseCase,
    'HistoryRepositoryInterface',
  ],
})
export class HistoryModule {}
