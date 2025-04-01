import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpsController } from './application/ups.controller';
import { UpsService } from './application/ups.service';
import { Ups } from './domain/entities/ups.entity';
import { UpsDomainService } from './domain/services/ups.domain.service';
import { UpsTypeormRepository } from './infrastructure/repositories/ups.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Ups])],
  controllers: [UpsController],
  providers: [
    UpsService,
    UpsDomainService,
    {
      provide: 'UpsRepositoryInterface',
      useClass: UpsTypeormRepository,
    },
  ],
  exports: [UpsService],
})
export class UpsModule {}
