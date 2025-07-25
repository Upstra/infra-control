import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './application/controllers/room.controller';
import { Room } from './domain/entities/room.entity';
import { RoomTypeormRepository } from './infrastructure/repositories/room.typeorm.repository';
import { RoomUseCases } from './application/use-cases';
import { SetupModule } from '../setup/setup.module';
import { AuditModule } from '../audit/audit.module';
import { PermissionModule } from '../permissions/permission.module';
import { UserModule } from '../users/user.module';

@Module({
  controllers: [RoomController],
  imports: [
    TypeOrmModule.forFeature([Room]),
    forwardRef(() => SetupModule),
    PermissionModule,
    forwardRef(() => UserModule),
    AuditModule,
  ],

  providers: [
    ...RoomUseCases,
    {
      provide: 'RoomRepositoryInterface',
      useClass: RoomTypeormRepository,
    },
  ],
  exports: [...RoomUseCases, 'RoomRepositoryInterface'],
})
export class RoomModule {}
