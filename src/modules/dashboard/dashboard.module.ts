import { forwardRef, Module } from '@nestjs/common';
import { DashboardController } from './application/controllers/dashboard.controller';
import { SetupModule } from '../setup/setup.module';
import { RedisModule } from '../redis/redis.module';
import { DashboardUseCases } from './application/use-cases';
import { SetupStatisticsAdapter } from './infrastructure/adapters/setup-statistics.adapters';
import { ServerModule } from '../servers/server.module';
import { PresenceModule } from '../presence/presence.module';
import { VmModule } from '../vms/vm.module';
import { UserModule } from '../users/user.module';
import { RoomModule } from '../rooms/room.module';
import { UpsModule } from '../ups/ups.module';

@Module({
  controllers: [DashboardController],
  providers: [
    ...DashboardUseCases,
    {
      provide: 'StatisticsPort',
      useClass: SetupStatisticsAdapter,
    },
  ],
  imports: [
    forwardRef(() => SetupModule),
    RedisModule,
    ServerModule,
    PresenceModule,
    VmModule,
    UserModule,
    RoomModule,
    UpsModule,
  ],
})
export class DashboardModule {}
