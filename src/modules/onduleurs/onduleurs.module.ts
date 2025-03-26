import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnduleurController } from './application/onduleur.controller';
import { OnduleurService } from './application/onduleur.service';
import { Onduleur } from './domain/entities/onduleur.entity';
import { OnduleurDomainService } from './domain/services/onduleur.domain.service';
import { OnduleurTypeormRepository } from './infrastructure/repositories/onduleurs.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Onduleur])],
  controllers: [OnduleurController],
  providers: [
    OnduleurService,
    OnduleurDomainService,
    {
      provide: 'OnduleurRepositoryInterface',
      useClass: OnduleurTypeormRepository,
    },
  ],
  exports: [OnduleurService],
})
export class OnduleursModule {}
