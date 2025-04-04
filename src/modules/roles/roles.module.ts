import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './application/role.controller';
import { RoleService } from './application/role.service';
import { Role } from './domain/entities/role.entity';
import { RoleDomainService } from './domain/services/role.domain.service';
import { RoleTypeormRepository } from './infrastructure/repositories/roles.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  controllers: [RoleController],
  providers: [
    RoleService,
    RoleDomainService,
    {
      provide: 'RoleRepositoryInterface',
      useClass: RoleTypeormRepository,
    },
  ],
  exports: [RoleService],
})
export class RolesModule {}
