import { Module } from '@nestjs/common';
import {
  GetHistoryStatsUseCase,
  GetHistoryListUseCase,
} from './application/use-cases';
import { HistoryController } from './application/controllers/history.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [HistoryController],
  providers: [GetHistoryStatsUseCase, GetHistoryListUseCase],
  exports: [GetHistoryStatsUseCase, GetHistoryListUseCase],
})
export class HistoryModule {}
