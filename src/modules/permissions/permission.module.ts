import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './domain/entities/permission.entity';
import { PermissionServer } from './domain/entities/permission.server.entity';
import { PermissionVm } from './domain/entities/permission.vm.entity';
import { PermissionVmRepository } from './infrastructure/repositories/permission.vm.repository';
import { PermissionServerRepository } from './infrastructure/repositories/permission.server.repository';
import { PermissionVmService } from './application/services/permission.vm.service';
import { PermissionServerService } from './application/services/permission.server.service';
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
    PermissionVmRepository,
    PermissionServerRepository,
  ],
})
export class PermissionModule {}
