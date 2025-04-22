import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './infrastructure/controllers/role.controller';
import { Role } from './domain/entities/role.entity';
import { RoleTypeormRepository } from './infrastructure/repositories/role.typeorm.repository';
import { PermissionModule } from '../permissions/permission.module';
import { RoleDomainService } from './domain/services/role.domain.service';
import { UserModule } from '../users/user.module';
import { RoleUseCases } from './application/use-cases';

@Module({
  controllers: [RoleController],
  imports: [
    TypeOrmModule.forFeature([Role]),
    PermissionModule,
    forwardRef(() => UserModule),
  ],
  providers: [
    ...RoleUseCases,
    RoleDomainService,
    {
      provide: 'RoleRepositoryInterface',
      useClass: RoleTypeormRepository,
    },
  ],
  exports: [...RoleUseCases, RoleDomainService],
})
export class RoleModule {}
