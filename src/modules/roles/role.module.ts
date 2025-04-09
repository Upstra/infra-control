import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './application/controllers/role.controller';
import { RoleService } from './application/services/role.service';
import { Role } from './domain/entities/role.entity';
import { RoleTypeormRepository } from './infrastructure/repositories/role.typeorm.repository';
import { PermissionModule } from '../permissions/permission.module';
import { RoleDomainService } from './domain/services/role.domain.service';
import { UserModule } from '../users/user.module';

@Module({
  controllers: [RoleController],
  exports: [RoleService, RoleDomainService],
  imports: [TypeOrmModule.forFeature([Role]), PermissionModule, forwardRef(() => UserModule)],
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
