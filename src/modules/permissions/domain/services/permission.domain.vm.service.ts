import { Injectable } from '@nestjs/common';
import { PermissionVm } from '../entities/permission.vm.entity';
import { PermissionBit } from '../value-objects/permission-bit.enum';

@Injectable()
export class PermissionDomainVmService {
  createFullPermissionEntity(): PermissionVm {
    const entity = new PermissionVm();
    entity.bitmask = PermissionBit.READ | PermissionBit.WRITE;
    return entity;
  }

  createReadOnlyPermissionEntity(): PermissionVm {
    const entity = new PermissionVm();
    entity.bitmask = PermissionBit.READ;
    return entity;
  }
}
