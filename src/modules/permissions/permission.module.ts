import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionController } from './application/permission.controller';
import { Permission } from './domain/entities/permission.entity';
import { PermissionServer } from './domain/entities/permission.server.entity';
import { PermissionVm } from './domain/entities/permission.vm.entity';
import { PermissionVmDomainService } from './domain/services/permission.vm.domain.service';
import { PermissionServerDomainService } from './domain/services/permission.server.domain.service';
import { PermissionVmTypeormRepository } from './infrastructure/repositories/permission.vm.typeorm.repository';
import { PermissionServerTypeormRepository } from './infrastructure/repositories/permission.server.typeorm.repository';
import { PermissionService } from './application/permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, PermissionServer, PermissionVm]),
  ],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    PermissionVmDomainService,
    PermissionServerDomainService,
    {
      provide: 'PermissionRepositoryInterface',
      useClass: PermissionVmTypeormRepository,
    },
    {
      provide: 'PermissionRepositoryInterface',
      useClass: PermissionServerTypeormRepository,
    },
  ],
  exports: [PermissionService],
})
export class PermissionModule {}
