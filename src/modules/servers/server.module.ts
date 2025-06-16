import { Module } from '@nestjs/common';
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

@Module({
  controllers: [ServerController],
  exports: [...ServerUseCases],
  imports: [
    TypeOrmModule.forFeature([Server]),
    IloModule,
    PermissionModule,
    UserModule,
    RoomModule,
    GroupModule,
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
