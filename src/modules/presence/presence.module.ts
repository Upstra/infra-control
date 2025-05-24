import { Module, forwardRef } from '@nestjs/common';
import { PresenceService } from './application/services/presence.service';
import { UserGateway } from './application/gateway/user.gateway';
import { UserModule } from '../users/user.module';
import { RedisModule } from '@/modules/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { PresenceController } from './application/controllers/presence.controller';

@Module({
  controllers: [PresenceController],
  imports: [
    RedisModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  providers: [UserGateway, PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
