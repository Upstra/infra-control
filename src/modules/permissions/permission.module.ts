import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './domain/entities/permission.entity';
import { PermissionServer } from './domain/entities/permission.server.entity';
import { PermissionVm } from './domain/entities/permission.vm.entity';
import { PermissionVmDomainService } from './domain/services/permission.vm.domain.service';
import { PermissionServerDomainService } from './domain/services/permission.server.domain.service';
import { PermissionVmTypeormRepository } from './infrastructure/repositories/permission.vm.typeorm.repository';
import { PermissionServerTypeormRepository } from './infrastructure/repositories/permission.server.typeorm.repository';
import { PermissionVmService } from './application/services/permission.vm.service.service';
import { PermissionServerService } from './application/services/permission.server.service.service';
import { PermissionVmController } from './application/controllers/permission.vm.controller';
import { PermissionServerController } from './application/controllers/permission.server.controller';

@Module({
  controllers: [PermissionVmController, PermissionServerController],
  exports: [PermissionVmService, PermissionServerService],
  imports: [
    TypeOrmModule.forFeature([Permission, PermissionServer, PermissionVm]),
  ],
  providers: [
    PermissionVmService,
    PermissionServerService,
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
})
export class PermissionModule {}
