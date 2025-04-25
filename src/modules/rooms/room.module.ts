import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './infrastructure/repositories/controllers/room.controller';
import { Room } from './domain/entities/room.entity';
import { RoomTypeormRepository } from './infrastructure/repositories/room.typeorm.repository';
import { RoomUseCases } from './application/use-cases';

@Module({
  controllers: [RoomController],
  exports: [...RoomUseCases],
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [
    ...RoomUseCases,
    {
      provide: 'RoomRepositoryInterface',
      useClass: RoomTypeormRepository,
    },
  ],
})
export class RoomModule {}
