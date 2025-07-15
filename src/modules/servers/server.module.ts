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
import { AuditModule } from '../audit/audit.module';
import { UpsModule } from '../ups/ups.module';
import { PingModule } from '@/core/services/ping';
import { PingServerUseCase } from './application/use-cases/ping-server.use-case';
import { IsUniqueServerPriorityConstraint } from './application/validators/unique-server-priority.validator';

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
    forwardRef(() => GroupModule),
    PermissionModule,
    AuditModule,
    PingModule,
  ],
  providers: [
    ...ServerUseCases,
    PingServerUseCase,
    ServerDomainService,
    IsUniqueServerPriorityConstraint,
    {
      provide: 'ServerRepositoryInterface',
      useClass: ServerTypeormRepository,
    },
  ],
})
export class ServerModule {}
