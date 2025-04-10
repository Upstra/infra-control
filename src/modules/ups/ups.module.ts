import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpsController } from './application/controllers/ups.controller';
import { UpsService } from './application/services/ups.service';
import { Ups } from './domain/entities/ups.entity';
import { UpsTypeormRepository } from './infrastructure/repositories/ups.typeorm.repository';

@Module({
  controllers: [UpsController],
  exports: [UpsService],
  imports: [TypeOrmModule.forFeature([Ups])],
  providers: [
    UpsService,
    {
      provide: 'UpsRepositoryInterface',
      useClass: UpsTypeormRepository,
    },
  ],
})
export class UpsModule {}
