import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { UpsController } from './application/controllers/ups.controller';
import { UpsBatteryController } from './application/controllers/ups-battery.controller';
import { Ups } from './domain/entities/ups.entity';
import { UpsTypeormRepository } from './infrastructure/repositories/ups.typeorm.repository';
import { UpsUseCases } from './application/use-cases';
import { UpsDomainService } from './domain/services/ups.domain.service';
import { AuditModule } from '../audit/audit.module';
import { UserModule } from '../users/user.module';
import { PingModule } from '@/core/services/ping';
import { PythonExecutorModule } from '@/core/services/python-executor';
import { PingUpsUseCase } from './application/use-cases/ping-ups.use-case';
import { GetUpsBatteryUseCase } from './application/use-cases/get-ups-battery.use-case';
import { CheckAllUpsBatteriesUseCase } from './application/use-cases/check-all-ups-batteries.use-case';
import { GetUpsBatteryStatusPaginatedUseCase } from './application/use-cases/get-ups-battery-status-paginated.use-case';
import { UpsBatteryDomainService } from './domain/services/ups-battery.domain.service';
import { UpsBatteryAlertListener } from './infrastructure/listeners/ups-battery-alert.listener';
import { UpsGateway } from './infrastructure/gateways/ups.gateway';
import { UpsBatteryGateway } from './application/gateway/ups-battery.gateway';
import { UpsBatteryCacheService } from './application/services/ups-battery-cache.service';

@Module({
  controllers: [UpsController, UpsBatteryController],
  exports: [
    ...UpsUseCases,
    'UpsRepositoryInterface',
    GetUpsBatteryUseCase,
    UpsBatteryCacheService,
  ],
  imports: [
    TypeOrmModule.forFeature([Ups]),
    AuditModule,
    forwardRef(() => UserModule),
    PingModule,
    PythonExecutorModule,
    ScheduleModule.forRoot(),
    CacheModule.register(),
  ],
  providers: [
    ...UpsUseCases,
    PingUpsUseCase,
    GetUpsBatteryUseCase,
    CheckAllUpsBatteriesUseCase,
    GetUpsBatteryStatusPaginatedUseCase,
    UpsDomainService,
    UpsBatteryDomainService,
    UpsBatteryAlertListener,
    UpsGateway,
    UpsBatteryGateway,
    UpsBatteryCacheService,
    UpsTypeormRepository,
    {
      provide: 'UpsRepositoryInterface',
      useClass: UpsTypeormRepository,
    },
  ],
})
export class UpsModule {}
