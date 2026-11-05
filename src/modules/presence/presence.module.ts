import { Module, forwardRef } from '@nestjs/common';
import { PresenceService } from './application/services/presence.service';
import { UserGateway } from './application/gateway/user.gateway';
import { UserModule } from '../users/user.module';
import { RedisModule } from '@/modules/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { PresenceController } from './application/controllers/presence.controller';
import { PresenceDomainService } from './domain/services/presence.domain.service';
import { PresenceIdleScheduler } from './application/schedulers/presence-idle.scheduler';

@Module({
  controllers: [PresenceController],
  imports: [
    RedisModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  providers: [
    UserGateway,
    PresenceService,
    PresenceDomainService,
    PresenceIdleScheduler,
  ],
  exports: [PresenceService],
})
export class PresenceModule {}
