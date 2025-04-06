import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './application/role.controller';
import { RoleService } from './application/role.service';
import { Role } from './domain/entities/role.entity';
import { RoleDomainService } from './domain/services/role.domain.service';
import { RoleTypeormRepository } from './infrastructure/repositories/role.typeorm.repository';

@Module({
  controllers: [RoleController],
  exports: [RoleService],
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [
    RoleService,
    RoleDomainService,
    {
      provide: 'RoleRepositoryInterface',
      useClass: RoleTypeormRepository,
    },
  ],
})
export class RoleModule {}
