import { Module, forwardRef } from '@nestjs/common';
import {
  GetHistoryStatsUseCase,
  GetHistoryListUseCase,
} from './application/use-cases';
import { HistoryController } from './application/controllers/history.controller';
import { AuditModule } from '../audit/audit.module';
import { UserModule } from '../users/user.module';

@Module({
  imports: [AuditModule, forwardRef(() => UserModule)],
  controllers: [HistoryController],
  providers: [GetHistoryStatsUseCase, GetHistoryListUseCase],
  exports: [GetHistoryStatsUseCase, GetHistoryListUseCase],
})
export class HistoryModule {}
