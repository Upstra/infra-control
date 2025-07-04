import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './application/controllers/role.controller';
import { Role } from './domain/entities/role.entity';
import { RoleTypeormRepository } from './infrastructure/repositories/role.typeorm.repository';
import { PermissionModule } from '../permissions/permission.module';
import { RoleDomainService } from './domain/services/role.domain.service';
import { SafeRoleDeletionDomainService } from './domain/services/safe-role-deletion.domain.service';
import { UserModule } from '../users/user.module';
import { RoleUseCases } from './application/use-cases';
import { PresenceModule } from '../presence/presence.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  controllers: [RoleController],
  imports: [
    TypeOrmModule.forFeature([Role]),
    PermissionModule,
    forwardRef(() => UserModule),
    forwardRef(() => PresenceModule),
    AuditModule,
  ],
  providers: [
    ...RoleUseCases,
    RoleDomainService,
    SafeRoleDeletionDomainService,
    {
      provide: 'RoleRepositoryInterface',
      useClass: RoleTypeormRepository,
    },
  ],
  exports: [
    ...RoleUseCases,
    RoleDomainService,
    SafeRoleDeletionDomainService,
    'RoleRepositoryInterface',
  ],
})
export class RoleModule {}
