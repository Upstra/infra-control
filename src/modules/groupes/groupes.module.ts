import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupeController } from './application/groupe.controller';
import { GroupeService } from './application/groupe.service';
import { Groupe } from './domain/entities/groupe.entity';
import { GroupeDomainService } from './domain/services/groupe.domain.service';
import { GroupeTypeormRepository } from './infrastructure/repositories/groupes.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Groupe])],
  controllers: [GroupeController],
  providers: [
    GroupeService,
    GroupeDomainService,
    {
      provide: 'GroupeRepositoryInterface',
      useClass: GroupeTypeormRepository,
    },
  ],
  exports: [GroupeService],
})
export class GroupesModule {}
