import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpsController } from './application/controllers/ups.controller';
import { Ups } from './domain/entities/ups.entity';
import { UpsTypeormRepository } from './infrastructure/repositories/ups.typeorm.repository';
import { UpsUseCases } from './application/use-cases';

@Module({
  controllers: [UpsController],
  exports: [...UpsUseCases],
  imports: [TypeOrmModule.forFeature([Ups])],
  providers: [
    ...UpsUseCases,
    {
      provide: 'UpsRepositoryInterface',
      useClass: UpsTypeormRepository,
    },
  ],
})
export class UpsModule {}
