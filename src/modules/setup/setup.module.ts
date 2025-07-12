import { Module, forwardRef } from '@nestjs/common';
import { SetupController } from './application/controllers/setup.controller';
import { SetupUseCases } from './application/use-cases';

import { UpsModule } from '../ups/ups.module';
import { RedisModule } from '../redis/redis.module';

import { UserModule } from '../users/user.module';
import { RoomModule } from '../rooms/room.module';
import { ServerModule } from '../servers/server.module';
import { SetupDomainService } from './domain/services/setup.domain.service';
import { SetupStatusMapper } from './application/mappers/setup-status.mapper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SetupProgress } from './domain/entities/setup-progress.entity';
import { SetupProgressRepository } from './infrastructure/repositories/setup.typeorm.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([SetupProgress]),
    RedisModule,
    forwardRef(() => UserModule),
    forwardRef(() => RoomModule),
    forwardRef(() => ServerModule),
    forwardRef(() => UpsModule),
  ],
  controllers: [SetupController],
  providers: [
    ...SetupUseCases,
    SetupDomainService,
    SetupStatusMapper,
    {
      provide: 'SetupProgressRepositoryInterface',
      useClass: SetupProgressRepository,
    },
  ],
  exports: [
    ...SetupUseCases,
    SetupDomainService,
    SetupStatusMapper,
    {
      provide: 'SetupProgressRepositoryInterface',
      useClass: SetupProgressRepository,
    },
  ],
})
export class SetupModule {}
