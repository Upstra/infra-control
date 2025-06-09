import { Module, forwardRef } from '@nestjs/common';
import { SetupController } from './application/controllers/setup.controller';
import { SetupUseCases } from './application/use-cases';

import { UpsModule } from '../ups/ups.module';

import { UserModule } from '../users/user.module';
import { RoomModule } from '../rooms/room.module';
import { ServerModule } from '../servers/server.module';
import { SetupDomainService } from './domain/services/setup.domain.service';
import { SetupStatusMapper } from './application/mappers/setup-status.mapper';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoomModule),
    forwardRef(() => ServerModule),
    forwardRef(() => UpsModule),
  ],
  controllers: [SetupController],
  providers: [...SetupUseCases, SetupDomainService, SetupStatusMapper],
})
export class SetupModule {}
