import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './application/controllers/role.controller';
import { RoleService } from './application/services/role.service';
import { Role } from './domain/entities/role.entity';
import { RoleTypeormRepository } from './infrastructure/repositories/role.typeorm.repository';
import { PermissionModule } from '../permissions/permission.module';
import { RoleDomainService } from './domain/services/role.domain.service';

@Module({
  controllers: [RoleController],
  exports: [RoleService, RoleDomainService],
  imports: [TypeOrmModule.forFeature([Role]), PermissionModule],
  providers: [
    RoleService,
    RoleDomainService,
    {
      provide: 'RoleRepositoryInterface',
      useClass: RoleTypeormRepository,
    },
  ],
})
export class RoleModule { }
