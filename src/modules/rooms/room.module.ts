import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './application/controllers/room.controller';
import { Room } from './domain/entities/room.entity';
import { RoomTypeormRepository } from './infrastructure/repositories/room.typeorm.repository';
import { RoomUseCases } from './application/use-cases';
import { SetupModule } from '../setup/setup.module';
import { HistoryModule } from '../history/history.module';

@Module({
  controllers: [RoomController],
  imports: [
    TypeOrmModule.forFeature([Room]),
    forwardRef(() => SetupModule),
    PermissionModule,
    forwardRef(() => UserModule),
    HistoryModule
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
