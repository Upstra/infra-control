import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerController } from './application/controllers/server.controller';
import { Server } from './domain/entities/server.entity';
import { ServerTypeormRepository } from './infrastructure/repositories/server.typeorm.repository';
import { IloModule } from '../ilos/ilo.module';
import { ServerDomainService } from './domain/services/server.domain.service';
import { ServerUseCases } from './application/use-cases';
import { PermissionModule } from '../permissions/permission.module';
import { UserModule } from '../users/user.module';
import { RoomModule } from '../rooms/room.module';
import { GroupModule } from '../groups/group.module';
import { HistoryModule } from '../history/history.module';
import { UpsModule } from '../ups/ups.module';

@Module({
  controllers: [ServerController],
  exports: [...ServerUseCases, 'ServerRepositoryInterface'],
  imports: [
    TypeOrmModule.forFeature([Server]),
    IloModule,
    PermissionModule,
    forwardRef(() => UserModule),
    forwardRef(() => RoomModule),
    forwardRef(() => UpsModule),
    GroupModule,
    PermissionModule,
    HistoryModule,
  ],
  providers: [
    ...ServerUseCases,
    ServerDomainService,
    {
      provide: 'ServerRepositoryInterface',
      useClass: ServerTypeormRepository,
    },
  ],
})
export class ServerModule {}
