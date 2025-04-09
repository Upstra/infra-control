import { Injectable } from '@nestjs/common';
import { PermissionServer } from '../entities/permission.server.entity';
import { PermissionVm } from '../entities/permission.vm.entity';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionDomainVmService {
  createFullPermissionEntity(): PermissionVm {
    const entity = new PermissionVm();
    entity.allowRead = true;
    entity.allowWrite = true;
    return entity;
  }

  createReadOnlyPermissionEntity(): PermissionVm {
    const entity = new PermissionVm();
    entity.allowRead = true;
    entity.allowWrite = false;
    return entity;
  }
}
