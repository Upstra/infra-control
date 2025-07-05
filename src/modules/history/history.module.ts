import { Module, forwardRef } from '@nestjs/common';
import {
  GetHistoryStatsUseCase,
  GetHistoryListUseCase,
  GetHistoryEntityTypesUseCase,
} from './application/use-cases';
import { HistoryController } from './application/controllers/history.controller';
import { AuditModule } from '../audit/audit.module';
import { UserModule } from '../users/user.module';

@Module({
  imports: [AuditModule, forwardRef(() => UserModule)],
  controllers: [HistoryController],
  providers: [
    GetHistoryStatsUseCase,
    GetHistoryListUseCase,
    GetHistoryEntityTypesUseCase,
  ],
  exports: [
    GetHistoryStatsUseCase,
    GetHistoryListUseCase,
    GetHistoryEntityTypesUseCase,
  ],
})
export class HistoryModule {}
