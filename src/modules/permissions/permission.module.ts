import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionVmController } from './infrastructure/controllers/permission.vm.controller';
import { PermissionServerController } from './infrastructure/controllers/permission.server.controller';

import { PermissionDomainServerService } from './domain/services/permission.domain.server.service';
import { PermissionDomainVmService } from './domain/services/permission.domain.vm.service';

import { Permission } from './domain/entities/permission.entity';
import { PermissionServer } from './domain/entities/permission.server.entity';
import { PermissionVm } from './domain/entities/permission.vm.entity';

import { PermissionVmRepository } from './infrastructure/repositories/permission.vm.repository';
import { PermissionServerRepository } from './infrastructure/repositories/permission.server.repository';

import { PermissionVmUseCases } from './application/use-cases/permission-vm';
import { PermissionServerUseCases } from './application/use-cases/permission-server';

@Module({
  controllers: [PermissionVmController, PermissionServerController],
  imports: [
    TypeOrmModule.forFeature([Permission, PermissionServer, PermissionVm]),
  ],
  providers: [
    ...PermissionVmUseCases,
    ...PermissionServerUseCases,
    PermissionDomainVmService,
    PermissionDomainServerService,
    PermissionVmRepository,
    PermissionServerRepository,
  ],
  exports: [
    ...PermissionVmUseCases,
    ...PermissionServerUseCases,
    PermissionDomainVmService,
    PermissionDomainServerService,
  ],
})
export class PermissionModule {}
