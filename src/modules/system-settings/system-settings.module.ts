import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemSettings } from './domain/entities/system-settings.entity';
import { SystemSettingsRepository } from './infrastructure/repositories/system-settings.repository';
import { DefaultSettingsService } from './domain/services/default-settings.service';
import { SystemSettingsService } from './domain/services/system-settings.service';
import { GetSystemSettingsUseCase } from './application/use-cases/get-system-settings.use-case';
import { UpdateSystemSettingsUseCase } from './application/use-cases/update-system-settings.use-case';
import { ResetSettingsCategoryUseCase } from './application/use-cases/reset-settings-category.use-case';
import { TestEmailConfigurationUseCase } from './application/use-cases/test-email-configuration.use-case';
import { ExportSettingsUseCase } from './application/use-cases/export-settings.use-case';
import { ImportSettingsUseCase } from './application/use-cases/import-settings.use-case';
import { SystemSettingsController } from './application/controllers/system-settings.controller';
import { HistoryModule } from '../history/history.module';
import { LogHistoryUseCase } from '../history/application/use-cases/log-history.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSettings]), HistoryModule],
  controllers: [SystemSettingsController],
  providers: [
    {
      provide: 'ISystemSettingsRepository',
      useClass: SystemSettingsRepository,
    },
    SystemSettingsRepository,
    DefaultSettingsService,
    {
      provide: SystemSettingsService,
      useFactory: (
        repository: SystemSettingsRepository,
        defaultSettingsService: DefaultSettingsService,
        eventEmitter: EventEmitter2,
        logHistoryUseCase: LogHistoryUseCase,
      ) => {
        return new SystemSettingsService(
          repository,
          defaultSettingsService,
          eventEmitter,
          logHistoryUseCase,
        );
      },
      inject: [
        SystemSettingsRepository,
        DefaultSettingsService,
        EventEmitter2,
        LogHistoryUseCase,
      ],
    },

    GetSystemSettingsUseCase,
    UpdateSystemSettingsUseCase,
    ResetSettingsCategoryUseCase,
    TestEmailConfigurationUseCase,
    ExportSettingsUseCase,
    ImportSettingsUseCase,
  ],
  exports: [SystemSettingsService, DefaultSettingsService],
})
export class SystemSettingsModule {}
