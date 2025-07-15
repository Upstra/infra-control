import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionServerController } from './application/controllers/permission.server.controller';

import { PermissionDomainServerService } from './domain/services/permission.domain.server.service';

import { Permission } from './domain/entities/permission.entity';
import { PermissionServer } from './domain/entities/permission.server.entity';

import { PermissionServerRepository } from './infrastructure/repositories/permission.server.repository';

import { PermissionServerUseCases } from './application/use-cases';
import { UserModule } from '../users/user.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  controllers: [PermissionServerController],
  imports: [
    TypeOrmModule.forFeature([Permission, PermissionServer]),
    forwardRef(() => UserModule),
    AuditModule,
  ],
  providers: [
    ...PermissionServerUseCases,
    PermissionDomainServerService,
    {
      provide: 'PermissionServerRepositoryInterface',
      useClass: PermissionServerRepository,
    },
  ],
  exports: [
    ...PermissionServerUseCases,
    PermissionDomainServerService,
    'PermissionServerRepositoryInterface',
  ],
})
export class PermissionModule {}
