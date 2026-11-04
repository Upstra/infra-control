import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { RedisModule } from '../redis/redis.module';
import { UserModule } from '../users/user.module';
import { ServerModule } from '../servers/server.module';
import { Alert } from './domain/entities/alert.entity';
import { AlertTransition } from './domain/entities/alert-transition.entity';
import { AlertService } from './domain/services/alert.service';
import { AlertTypeormRepository } from './infrastructure/repositories/alert.typeorm.repository';
import { AlertTransitionTypeormRepository } from './infrastructure/repositories/alert-transition.typeorm.repository';
import { AlertUseCases } from './application/use-cases';
import { AlertsController } from './application/controllers/alerts.controller';
import { EventsFeedController } from './application/controllers/events-feed.controller';
import { AlertsGateway } from './application/gateway/alerts.gateway';
import { UpsAlertsListener } from './application/listeners/ups-alerts.listener';
import { AlertEmailListener } from './application/listeners/alert-email.listener';
import { AlertPermissionService } from './application/services/alert-permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, AlertTransition]),
    AuditModule,
    RedisModule,
    forwardRef(() => UserModule),
    forwardRef(() => ServerModule),
  ],
  controllers: [AlertsController, EventsFeedController],
  providers: [
    ...AlertUseCases,
    AlertService,
    AlertPermissionService,
    AlertsGateway,
    UpsAlertsListener,
    AlertEmailListener,
    {
      provide: 'AlertRepositoryInterface',
      useClass: AlertTypeormRepository,
    },
    {
      provide: 'AlertTransitionRepositoryInterface',
      useClass: AlertTransitionTypeormRepository,
    },
  ],
  exports: [...AlertUseCases, AlertService, 'AlertRepositoryInterface'],
})
export class AlertsModule {}
