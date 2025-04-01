import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupController } from './application/group.controller';
import { GroupService } from './application/group.service';
import { Group } from './domain/entities/group.entity';
import { GroupDomainService } from './domain/services/group.domain.service';
import { GroupTypeormRepository } from './infrastructure/repositories/group.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Group])],
  controllers: [GroupController],
  providers: [
    GroupService,
    GroupDomainService,
    {
      provide: 'GroupRepositoryInterface',
      useClass: GroupTypeormRepository,
    },
  ],
  exports: [GroupService],
})
export class GroupModule {}
