import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './application/controllers/room.controller';
import { RoomService } from './application/services/room.service';
import { Room } from './domain/entities/room.entity';
import { RoomTypeormRepository } from './infrastructure/repositories/room.typeorm.repository';

@Module({
  controllers: [RoomController],
  exports: [RoomService],
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [
    RoomService,
    {
      provide: 'RoomRepositoryInterface',
      useClass: RoomTypeormRepository,
    },
  ],
})
export class RoomModule {}
