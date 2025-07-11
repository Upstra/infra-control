import { Module, forwardRef } from '@nestjs/common';
import {
  GetHistoryStatisticsUseCase,
  GetHistoryStatsUseCase,
  GetHistoryListUseCase,
  GetHistoryEntityTypesUseCase,
  GetHistoryActionTypesUseCase,
} from './application/use-cases';
import { HistoryController } from './application/controllers/history.controller';
import { AuditModule } from '../audit/audit.module';
import { UserModule } from '../users/user.module';

@Module({
  imports: [AuditModule, forwardRef(() => UserModule)],
  controllers: [HistoryController],
  providers: [
    GetHistoryStatisticsUseCase,
    GetHistoryStatsUseCase,
    GetHistoryListUseCase,
    GetHistoryEntityTypesUseCase,
    GetHistoryActionTypesUseCase,
  ],
  exports: [
    GetHistoryStatisticsUseCase,
    GetHistoryStatsUseCase,
    GetHistoryListUseCase,
    GetHistoryEntityTypesUseCase,
    GetHistoryActionTypesUseCase,
    AuditModule,
  ],
})
export class HistoryModule {}
