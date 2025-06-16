import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionVmController } from './application/controllers/permission.vm.controller';
import { PermissionServerController } from './application/controllers/permission.server.controller';

import { PermissionDomainServerService } from './domain/services/permission.domain.server.service';
import { PermissionDomainVmService } from './domain/services/permission.domain.vm.service';

import { Permission } from './domain/entities/permission.entity';
import { PermissionServer } from './domain/entities/permission.server.entity';
import { PermissionVm } from './domain/entities/permission.vm.entity';

import { PermissionVmRepository } from './infrastructure/repositories/permission.vm.repository';
import { PermissionServerRepository } from './infrastructure/repositories/permission.server.repository';

import { PermissionVmUseCases } from './application/use-cases/permission-vm';
import { PermissionServerUseCases } from './application/use-cases/permission-server';
import { UserModule } from '../users/user.module';

@Module({
  controllers: [PermissionVmController, PermissionServerController],
  imports: [
    TypeOrmModule.forFeature([Permission, PermissionServer, PermissionVm]),
    forwardRef(() => UserModule),
  ],
  providers: [
    ...PermissionVmUseCases,
    ...PermissionServerUseCases,
    PermissionDomainVmService,
    PermissionDomainServerService,
    {
      provide: 'PermissionServerRepositoryInterface',
      useClass: PermissionServerRepository,
    },
    {
      provide: 'PermissionVmRepositoryInterface',
      useClass: PermissionVmRepository,
    },
  ],
  exports: [
    ...PermissionVmUseCases,
    ...PermissionServerUseCases,
    PermissionDomainVmService,
    PermissionDomainServerService,
    'PermissionServerRepositoryInterface',
    'PermissionVmRepositoryInterface',
  ],
})
export class PermissionModule {}
