import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './application/room.controller';
import { RoomService } from './application/room.service';
import { Room } from './domain/entities/room.entity';
import { RoomDomainService } from './domain/services/room.domain.service';
import { RoomTypeormRepository } from './infrastructure/repositories/room.typeorm.repository';

@Module({
  controllers: [RoomController],
  exports: [RoomService],
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [
    RoomService,
    RoomDomainService,
    {
      provide: 'RoomRepositoryInterface',
      useClass: RoomTypeormRepository,
    },
  ],
})
export class RoomModule {}
