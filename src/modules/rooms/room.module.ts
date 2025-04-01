import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './application/room.controller';
import { RoomService } from './application/room.service';
import { Room } from './domain/entities/room.entity';
import { RoomDomainService } from './domain/services/room.domain.service';
import { RoomTypeormRepository } from './infrastructure/repositories/room.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  controllers: [RoomController],
  providers: [
    RoomService,
    RoomDomainService,
    {
      provide: 'RoomRepositoryInterface',
      useClass: RoomTypeormRepository,
    },
  ],
  exports: [RoomService],
})
export class RoomModule {}
