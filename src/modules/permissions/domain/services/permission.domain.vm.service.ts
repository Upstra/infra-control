import { Injectable } from '@nestjs/common';
import { PermissionVm } from '../entities/permission.vm.entity';

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
